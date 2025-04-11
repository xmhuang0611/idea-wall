export interface Idea {
  _id: string;
  title: string;
  description: string;
  category: string;
  feeling: number;
  tags: any[];
  total_votes: number;
  created_at: Date;
  created_by: string;
} 