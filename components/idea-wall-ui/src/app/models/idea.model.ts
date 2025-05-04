import { Tag } from './tag.model';

export interface Idea {
  _id: string;
  title: string;
  description: string;
  category: 'Idea' | 'Pain' | 'Thought';
  feeling: number;
  tags: number[];
  tag_details?: Tag[];
  total_votes: number;
  user_vote?: number;
  hasVoted?: boolean;
  created_at: Date;
  creator_id: string;
  creator_name: string;
  updated_at: Date;
  updater_id: string;
  updater_name: string;
} 