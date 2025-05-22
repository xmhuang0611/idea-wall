export enum SessionStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEED_IMPROVEMENT = 'NEED_IMPROVEMENT',
  RESUBMITTED = 'RESUBMITTED'
}

export interface BasicInfo {
  idea_title: string;
  submitter_id: string;
  submitter_name: string;
  submitter_job?: string;
  manager?: string;
  stream?: string;
  clients?: string;
}

export interface IdeaSession {
  id: string;
  idea_id: string;
  title: string;
  problem_statements: string;
  solutions: string;
  value: string;
  status: SessionStatus;
  session_version: number;
  is_current: boolean;
  has_final_decision: boolean;
  final_reviewer_id?: string;
  final_reviewer_name?: string;
  final_decision?: string;
  final_comments?: string;
  allow_resubmit?: boolean;
  review_count: number;
  min_required_reviews: number;
  created_at: Date;
  creator_id: string;
  creator_name: string;
  updated_at: Date;
  previous_session_id?: string;
  basic_info?: BasicInfo;
  submitter_job?: string;
  manager?: string;
  stream?: string;
  clients?: string;
}

export interface SessionReview {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewer_name: string;
  innovation_score: number;
  innovation_comments?: string;
  value_score: number;
  value_comments?: string;
  feasibility_score: number;
  feasibility_comments?: string;
  impact_score: number;
  impact_comments?: string;
  roi_score: number;
  roi_comments?: string;
  created_at: Date;
}

export interface SessionFinalDecision {
  session_id: string;
  reviewer_id: string;
  decision: string;
  comments: string;
  allow_resubmit: boolean;
} 