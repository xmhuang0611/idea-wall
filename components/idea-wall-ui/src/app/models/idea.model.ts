import { Tag } from './tag.model';

export interface Idea {
  id: string;
  title: string;
  description: string;
  feeling: number;
  tags: number[];
  tag_details?: Tag[];
  total_votes: number;
  total_comments: number;
  total_bookmarks: number;
  has_voted?: boolean;
  has_bookmarked?: boolean;
  created_at: Date;
  creator_id: string;
  creator_name: string;
  updated_at: Date;
  updater_id: string;
  updater_name: string;
  session_review?: SessionReview;
}

export interface IdeaHistory {
  id: string;
  idea_id: string;
  title: string;
  description: string;
  feeling: number;
  tags?: number[];
  tag_details?: Tag[];
  created_at: Date;
  creator_id: string;
  creator_name: string;
  action: string;
}

export enum ReviewStatus {
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface SessionReview {
  submitter_id?: string;
  submitter_name?: string;
  submitter_job?: string;
  manager?: string;
  stream?: string;
  clients?: string;
  problem_statements?: string;
  solutions?: string;
  values?: string;
  average_score: number;
  status: ReviewStatus;
  review_count: number;
  submitted_at?: Date;
} 