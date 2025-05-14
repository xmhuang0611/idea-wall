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
}

export interface IdeaTag {
  tag_id: number;
  tag_name: string;
} 