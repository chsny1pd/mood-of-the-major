import type { Comment, CreateCommentInput } from "../../../domain/entities/Comment.js";
import type {
  CommentListQuery,
  ICommentRepository,
} from "../../../domain/ports/ICommentRepository.js";
import { CommentModel } from "../models/Comment.js";

function toComment(doc: {
  _id: { toString(): string };
  moodId: { toString(): string };
  authorId: { toString(): string };
  parentId?: { toString(): string } | null;
  content: string;
  status: Comment["status"];
  reactionSummary: Record<string, number>;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): Comment {
  return {
    id: doc._id.toString(),
    moodId: doc.moodId.toString(),
    authorId: doc.authorId.toString(),
    parentId: doc.parentId?.toString() ?? null,
    content: doc.content,
    status: doc.status,
    reactionSummary: doc.reactionSummary ?? {},
    depth: doc.depth,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export class MongooseCommentRepository implements ICommentRepository {
  async create(input: CreateCommentInput): Promise<Comment> {
    const doc = await CommentModel.create({
      moodId: input.moodId,
      authorId: input.authorId,
      content: input.content,
      parentId: input.parentId ?? null,
      depth: input.depth,
      status: "active",
    });

    return toComment(doc.toObject());
  }

  async findById(id: string): Promise<Comment | null> {
    const doc = await CommentModel.findOne({
      _id: id,
      status: "active",
      deletedAt: null,
    }).lean();

    return doc ? toComment(doc) : null;
  }

  async findActiveByIdOnMood(commentId: string, moodId: string): Promise<Comment | null> {
    const doc = await CommentModel.findOne({
      _id: commentId,
      moodId,
      status: "active",
      deletedAt: null,
    }).lean();

    return doc ? toComment(doc) : null;
  }

  async findActiveByMood(query: CommentListQuery): Promise<Comment[]> {
    const filter: Record<string, unknown> = {
      moodId: query.moodId,
      status: "active",
      deletedAt: null,
    };

    if (query.cursorCreatedAt && query.cursorId) {
      const op = query.sort === "newest" ? "$lt" : "$gt";
      filter.$or = [
        { createdAt: { [op]: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { [op]: query.cursorId } },
      ];
    }

    const sort =
      query.sort === "newest"
        ? ({ createdAt: -1, _id: -1 } as const)
        : ({ createdAt: 1, _id: 1 } as const);

    const docs = await CommentModel.find(filter).sort(sort).limit(query.limit).lean();
    return docs.map(toComment);
  }

  async softDeleteByAuthor(commentId: string, authorId: string): Promise<boolean> {
    const result = await CommentModel.updateOne(
      { _id: commentId, authorId, deletedAt: null },
      { status: "deleted_by_author", deletedAt: new Date() },
    );

    return result.modifiedCount > 0;
  }

  async softDelete(commentId: string): Promise<boolean> {
    const result = await CommentModel.updateOne(
      { _id: commentId, deletedAt: null, status: "active" },
      { status: "deleted_by_author", deletedAt: new Date() },
    );

    return result.modifiedCount > 0;
  }

  async isAuthor(commentId: string, authorId: string): Promise<boolean> {
    const count = await CommentModel.countDocuments({ _id: commentId, authorId });
    return count > 0;
  }

  async adjustReactionSummary(
    commentId: string,
    reactionType: string,
    delta: number,
  ): Promise<Record<string, number>> {
    const key = `reactionSummary.${reactionType}`;
    const updated = await CommentModel.findOneAndUpdate(
      { _id: commentId },
      { $inc: { [key]: delta } },
      { new: true },
    ).lean();

    return (updated?.reactionSummary as Record<string, number>) ?? {};
  }
}
