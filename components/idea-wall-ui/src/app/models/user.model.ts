export type UserRole = 'ADMIN' | 'IDEA_SESSION_PANEL_REVIEWER' | 'IDEA_INCUBATOR_REVIEWER';

export interface User {
  user_id: string;
  user_name: string;
  roles: UserRole[];
  token?: string;
} 