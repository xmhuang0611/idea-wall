export interface Comment {
  id: string;
  idea_id: string;
  description: string;
  parent_id?: string;
  votes: number;
  created_at: Date;
  creator_id: string;
  creator_name: string;
  updated_at?: Date;
  updater_id?: string;
  updater_name?: string;
} 