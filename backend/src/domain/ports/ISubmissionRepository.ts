import type { ApprovalStatus, SubmissionType } from "../constants/approvalConstants.js";

export interface PendingFacultySubmission {
  id: string;
  type: "faculty";
  name: string;
  nameTh: string | null;
  slug: string;
  approvalStatus: ApprovalStatus;
  submittedBy: string | null;
  createdAt: Date;
}

export interface PendingMajorSubmission {
  id: string;
  type: "major";
  name: string;
  nameTh: string | null;
  slug: string;
  facultyId: string;
  facultyName: string;
  approvalStatus: ApprovalStatus;
  submittedBy: string | null;
  createdAt: Date;
}

export interface PendingTagSubmission {
  id: string;
  type: "tag";
  name: string;
  nameTh: string | null;
  slug: string;
  approvalStatus: ApprovalStatus;
  submittedBy: string | null;
  createdAt: Date;
}

export type PendingSubmission =
  | PendingFacultySubmission
  | PendingMajorSubmission
  | PendingTagSubmission;

export interface SubmitFacultyInput {
  name: string;
  nameTh?: string | null;
  submittedBy: string;
}

export interface SubmitMajorInput {
  facultyId: string;
  name: string;
  nameTh?: string | null;
  submittedBy: string;
}

export interface SubmitTagInput {
  name: string;
  nameTh?: string | null;
  submittedBy: string;
}

export interface UpdatePendingSubmissionInput {
  name?: string;
  nameTh?: string | null;
  facultyId?: string;
}

export interface ISubmissionRepository {
  submitFaculty(input: SubmitFacultyInput): Promise<PendingFacultySubmission>;
  submitMajor(input: SubmitMajorInput): Promise<PendingMajorSubmission>;
  submitTag(input: SubmitTagInput): Promise<PendingTagSubmission>;
  facultyNameExists(name: string): Promise<boolean>;
  majorNameExists(facultyId: string, name: string): Promise<boolean>;
  tagNameExists(name: string): Promise<boolean>;
  slugExists(type: SubmissionType, slug: string, facultyId?: string): Promise<boolean>;
  findPending(type?: SubmissionType): Promise<PendingSubmission[]>;
  countPending(): Promise<number>;
  countApprovedFaculties(): Promise<number>;
  countApprovedMajors(): Promise<number>;
  countApprovedTags(): Promise<number>;
  findPendingById(type: SubmissionType, id: string): Promise<PendingSubmission | null>;
  updatePending(type: SubmissionType, id: string, input: UpdatePendingSubmissionInput): Promise<PendingSubmission | null>;
  approve(type: SubmissionType, id: string): Promise<PendingSubmission | null>;
  reject(type: SubmissionType, id: string): Promise<PendingSubmission | null>;
  listApprovedFacultiesAdmin(): Promise<Array<{ id: string; name: string; nameTh: string | null; slug: string; isActive: boolean; approvalStatus: ApprovalStatus }>>;
  listApprovedMajorsAdmin(): Promise<Array<{ id: string; facultyId: string; facultyName: string; name: string; nameTh: string | null; slug: string; isActive: boolean; approvalStatus: ApprovalStatus }>>;
  listApprovedTagsAdmin(): Promise<Array<{ id: string; name: string; nameTh: string | null; slug: string; isActive: boolean; approvalStatus: ApprovalStatus }>>;
}
