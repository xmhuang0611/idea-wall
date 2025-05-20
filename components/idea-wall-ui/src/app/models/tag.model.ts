export interface Tag {
  tag_id: number;
  tag_name: string;
  parent_id: number;
  created_at?: Date;
  creator_id?: string;
  creator_name?: string;
  updated_at?: Date;
  updater_id?: string;
  updater_name?: string;
  children?: Tag[];
} 
