export interface Idea {
  _id: string;
  title: string;
  description: string;
  category: 'Idea' | 'Pain' | 'Thought';
  feeling: number;
  tags: number[];
  total_votes: number;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
} 