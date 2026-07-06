import type { CreateMoodInput } from "../../../domain/entities/Mood.js";
import type {
  IMoodRepository,
  MoodFeedQuery,
  MoodSearchQuery,
  MoodWithRelations,
} from "../../../domain/ports/IMoodRepository.js";
import { FacultyModel } from "../models/Faculty.js";
import { MajorModel } from "../models/Major.js";
import { MoodImageModel } from "../models/MoodImage.js";
import { MoodModel } from "../models/Mood.js";
import { MoodTagModel } from "../models/MoodTag.js";
import { TagModel } from "../models/Tag.js";
import { escapeRegex } from "../../../utils/escapeRegex.js";

async function hydrateMoods(
  moodDocs: Array<{
    _id: { toString(): string };
    authorId: { toString(): string };
    content: string;
    facultyId?: { toString(): string } | null;
    majorId?: { toString(): string } | null;
    status: MoodWithRelations["status"];
    commentCount: number;
    reactionSummary: Record<string, number>;
    imageCount: number;
    primaryTagId?: { toString(): string } | null;
    reportCount: number;
    lastActivityAt: Date;
    editedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }>,
): Promise<MoodWithRelations[]> {
  if (moodDocs.length === 0) return [];

  const moodIds = moodDocs.map((m) => m._id.toString());
  const facultyIds = [
    ...new Set(moodDocs.map((m) => m.facultyId?.toString()).filter(Boolean) as string[]),
  ];
  const majorIds = [
    ...new Set(moodDocs.map((m) => m.majorId?.toString()).filter(Boolean) as string[]),
  ];

  const [moodTags, images, faculties, majors] = await Promise.all([
    MoodTagModel.find({ moodId: { $in: moodIds } }).lean(),
    MoodImageModel.find({
      moodId: { $in: moodIds },
      status: "confirmed",
      deletedAt: null,
    })
      .sort({ sortOrder: 1 })
      .lean(),
    facultyIds.length > 0
      ? FacultyModel.find({ _id: { $in: facultyIds } }).lean()
      : Promise.resolve([]),
    majorIds.length > 0 ? MajorModel.find({ _id: { $in: majorIds } }).lean() : Promise.resolve([]),
  ]);

  const tagIds = [...new Set(moodTags.map((mt) => mt.tagId.toString()))];
  const tags = tagIds.length > 0 ? await TagModel.find({ _id: { $in: tagIds } }).lean() : [];

  const facultyMap = new Map(faculties.map((f) => [f._id.toString(), f]));
  const majorMap = new Map(majors.map((m) => [m._id.toString(), m]));
  const tagMap = new Map(tags.map((t) => [t._id.toString(), t]));

  return moodDocs.map((mood) => {
    const moodId = mood._id.toString();
    const moodTagRows = moodTags.filter((mt) => mt.moodId.toString() === moodId);
    const moodImages = images.filter((img) => img.moodId?.toString() === moodId);
    const faculty = mood.facultyId ? facultyMap.get(mood.facultyId.toString()) : undefined;
    const major = mood.majorId ? majorMap.get(mood.majorId.toString()) : undefined;

    return {
      id: moodId,
      authorId: mood.authorId.toString(),
      content: mood.content,
      facultyId: mood.facultyId?.toString() ?? null,
      majorId: mood.majorId?.toString() ?? null,
      status: mood.status,
      commentCount: mood.commentCount,
      reactionSummary: mood.reactionSummary ?? {},
      imageCount: mood.imageCount,
      primaryTagId: mood.primaryTagId?.toString() ?? null,
      reportCount: mood.reportCount,
      lastActivityAt: mood.lastActivityAt,
      editedAt: mood.editedAt ?? null,
      createdAt: mood.createdAt,
      updatedAt: mood.updatedAt,
      deletedAt: mood.deletedAt ?? null,
      tags: moodTagRows.map((mt) => ({
        tagId: mt.tagId.toString(),
        isPrimary: mt.isPrimary,
      })),
      faculty: faculty
        ? { id: faculty._id.toString(), name: faculty.name, slug: faculty.slug }
        : null,
      major: major
        ? { id: major._id.toString(), name: major.name, slug: major.slug }
        : null,
      tagDetails: moodTagRows
        .map((mt) => {
          const tag = tagMap.get(mt.tagId.toString());
          if (!tag) return null;

          return {
            id: tag._id.toString(),
            slug: tag.slug,
            name: tag.name,
            isPrimary: mt.isPrimary,
          };
        })
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
      images: moodImages.map((img) => ({
        id: img._id.toString(),
        sortOrder: img.sortOrder,
      })),
    };
  });
}

function buildFeedFilter(query: MoodFeedQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    status: "active",
    deletedAt: null,
  };

  if (query.facultyId) {
    filter.facultyId = query.facultyId;
  }

  if (query.majorId) {
    filter.majorId = query.majorId;
  }

  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = query.from;
    if (query.to) createdAt.$lte = query.to;
    filter.createdAt = createdAt;
  }

  if (query.cursorCreatedAt && query.cursorId) {
    filter.$or = [
      { createdAt: { $lt: query.cursorCreatedAt } },
      { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
    ];
  }

  return filter;
}

function buildSort(query: MoodFeedQuery): Record<string, 1 | -1> {
  switch (query.sort) {
    case "most_commented":
      return { commentCount: -1, createdAt: -1, _id: -1 };
    case "most_reacted":
      return { lastActivityAt: -1, createdAt: -1, _id: -1 };
    default:
      return { createdAt: -1, _id: -1 };
  }
}

export class MongooseMoodRepository implements IMoodRepository {
  async create(input: CreateMoodInput): Promise<MoodWithRelations> {
    const now = new Date();

    const moodDoc = await MoodModel.create({
      authorId: input.authorId,
      content: input.content,
      facultyId: input.facultyId,
      majorId: input.majorId,
      status: "active",
      primaryTagId: input.primaryTagId,
      imageCount: input.imageIds.length,
      lastActivityAt: now,
    });

    await MoodTagModel.insertMany(
      input.tagIds.map((tagId) => ({
        moodId: moodDoc._id,
        tagId,
        isPrimary: tagId === input.primaryTagId,
      })),
    );

    const hydrated = await hydrateMoods([moodDoc.toObject()]);
    return hydrated[0]!;
  }

  async findById(id: string): Promise<MoodWithRelations | null> {
    const moodDoc = await MoodModel.findOne({
      _id: id,
      status: "active",
      deletedAt: null,
    }).lean();

    if (!moodDoc) return null;

    const hydrated = await hydrateMoods([moodDoc]);
    return hydrated[0] ?? null;
  }

  async findByIdIncludingRemoved(id: string): Promise<MoodWithRelations | null> {
    const moodDoc = await MoodModel.findOne({
      _id: id,
      deletedAt: null,
      status: { $nin: ["moderated_removed"] },
    }).lean();

    if (!moodDoc) return null;

    const hydrated = await hydrateMoods([moodDoc]);
    return hydrated[0] ?? null;
  }

  async search(query: MoodSearchQuery): Promise<MoodWithRelations[]> {
    const pattern = escapeRegex(query.q.trim());

    const filter: Record<string, unknown> = {
      status: "active",
      deletedAt: null,
      content: { $regex: pattern, $options: "i" },
    };

    if (query.facultyId) filter.facultyId = query.facultyId;
    if (query.majorId) filter.majorId = query.majorId;

    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) createdAt.$gte = query.from;
      if (query.to) createdAt.$lte = query.to;
      filter.createdAt = createdAt;
    }

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $lt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
      ];
    }

    if (query.tagSlug) {
      const tag = await TagModel.findOne({
        slug: query.tagSlug.toLowerCase(),
        type: "emotion",
        isActive: true,
      }).lean();

      if (!tag) return [];

      const moodTagRows = await MoodTagModel.find({ tagId: tag._id }).select("moodId").lean();
      filter._id = { $in: moodTagRows.map((row) => row.moodId) };
    }

    const moodDocs = await MoodModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    return hydrateMoods(moodDocs);
  }

  async incrementCommentCount(moodId: string): Promise<void> {
    await MoodModel.updateOne(
      { _id: moodId },
      { $inc: { commentCount: 1 }, $set: { lastActivityAt: new Date() } },
    );
  }

  async decrementCommentCount(moodId: string): Promise<void> {
    await MoodModel.updateOne(
      { _id: moodId, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } },
    );
  }

  async adjustReactionSummary(
    moodId: string,
    reactionType: string,
    delta: number,
  ): Promise<Record<string, number>> {
    const key = `reactionSummary.${reactionType}`;
    const updated = await MoodModel.findOneAndUpdate(
      { _id: moodId },
      { $inc: { [key]: delta }, $set: { lastActivityAt: new Date() } },
      { new: true },
    ).lean();

    return (updated?.reactionSummary as Record<string, number>) ?? {};
  }

  async incrementReportCount(moodId: string): Promise<void> {
    await MoodModel.updateOne({ _id: moodId }, { $inc: { reportCount: 1 } });
  }

  async isActive(moodId: string): Promise<boolean> {
    const count = await MoodModel.countDocuments({
      _id: moodId,
      status: "active",
      deletedAt: null,
    });
    return count > 0;
  }

  async findActiveFeed(query: MoodFeedQuery): Promise<MoodWithRelations[]> {
    let filter = buildFeedFilter(query);

    if (query.tagSlug) {
      const tag = await TagModel.findOne({
        slug: query.tagSlug.toLowerCase(),
        type: "emotion",
        isActive: true,
      }).lean();

      if (!tag) {
        return [];
      }

      const moodTagRows = await MoodTagModel.find({ tagId: tag._id }).select("moodId").lean();
      const moodIds = moodTagRows.map((row) => row.moodId);

      filter = {
        ...filter,
        _id: { $in: moodIds },
      };
    }

    const moodDocs = await MoodModel.find(filter)
      .sort(buildSort(query))
      .limit(query.limit)
      .lean();

    return hydrateMoods(moodDocs);
  }

  async softDeleteByAuthor(moodId: string, authorId: string): Promise<boolean> {
    const result = await MoodModel.updateOne(
      { _id: moodId, authorId, deletedAt: null },
      {
        status: "deleted_by_author",
        deletedAt: new Date(),
      },
    );

    return result.modifiedCount > 0;
  }

  async isAuthor(moodId: string, authorId: string): Promise<boolean> {
    const count = await MoodModel.countDocuments({ _id: moodId, authorId });
    return count > 0;
  }
}
