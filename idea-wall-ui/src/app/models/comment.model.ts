export interface Comment {
  _id: string;
  idea_id: string;
  description: string;
  parent_id?: string;
  votes: number;
  created_at: Date;
  created_by: string;
} 