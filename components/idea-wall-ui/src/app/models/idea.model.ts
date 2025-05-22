import { Tag } from './tag.model';

export enum IdeaStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  IN_SESSION_REVIEW = "IN_SESSION_REVIEW",
  SESSION_APPROVED = "SESSION_APPROVED",
  SESSION_REJECTED = "SESSION_REJECTED",
  IN_INCUBATOR = "IN_INCUBATOR",
  INCUBATOR_COMPLETED = "INCUBATOR_COMPLETED",
  INCUBATOR_ABANDONED = "INCUBATOR_ABANDONED"
}

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
  current_status?: IdeaStatus;
  current_session_id?: string;
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