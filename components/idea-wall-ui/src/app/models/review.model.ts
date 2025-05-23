export interface ReviewScoreItem {
  score: number;
  comment: string;
}

export interface ReviewResult {
  innovation: ReviewScoreItem;
  value: ReviewScoreItem;
  feasibility: ReviewScoreItem;
  impact: ReviewScoreItem;
  return_on_investment: ReviewScoreItem;
  average_score?: number;
}

export interface Review {
  id: string;
  idea_id: string;
  target_type: string; // "Session" or "Incubator"
  reviewer_id: string;
  reviewer_name: string;
  review_result: ReviewResult;
  created_at: Date;
}

export const REVIEW_CRITERIA = {
  innovation: {
    title: 'Innovation',
    description: 'Evaluate the level of innovation introduced by the idea',
    levels: [
      { value: 1, label: 'Not Innovative', description: 'Replicates existing solutions' },
      { value: 2, label: 'Incrementally Innovative', description: 'Minor improvements' },
      { value: 3, label: 'Moderately Innovative', description: 'Introduces new features' },
      { value: 4, label: 'Highly Innovative', description: 'Significant advancement' },
      { value: 5, label: 'Extremely Innovative', description: 'Revolutionary changes or breakthroughs' }
    ]
  },
  value: {
    title: 'Value Creation',
    description: 'Assesses the value created by the innovation, including economic value, efficiency improvement, enhancing user experience, data-driven insights, etc.',
    levels: [
      { value: 1, label: 'Minimal Value', description: 'Limited impact on users or business' },
      { value: 2, label: 'Some Value', description: 'Address specific needs' },
      { value: 3, label: 'Substantial Value', description: 'Improves efficiency or effectiveness' },
      { value: 4, label: 'Significant Value', description: 'Delivers tangible benefits' },
      { value: 5, label: 'Exceptional Value', description: 'Transformative impact, generates significant value' }
    ]
  },
  feasibility: {
    title: 'Feasibility',
    description: 'Assesses the practicality and feasibility of implementing the idea',
    levels: [
      { value: 1, label: 'Not Feasible', description: 'Significant technical or resource barriers' },
      { value: 2, label: 'Marginally Feasible', description: 'Challenges require major effort' },
      { value: 3, label: 'Moderately Feasible', description: 'Manageable challenges' },
      { value: 4, label: 'Feasible', description: 'Minor challenges that can be overcome' },
      { value: 5, label: 'Highly Feasible', description: 'Minimal implementation challenges' }
    ]
  },
  impact: {
    title: 'Impact',
    description: 'Assesses the potential impact of the innovation on users and the organization',
    levels: [
      { value: 1, label: 'Negligible Impact', description: 'Minimal effect (Project level)' },
      { value: 2, label: 'Limited Impact', description: 'Affects special areas (CSI level, multiple projects)' },
      { value: 3, label: 'Moderate Impact', description: 'Improves efficiency or user experience significantly (Organization level)' },
      { value: 4, label: 'Significant Impact', description: 'Transforms operations or strategy (FI level)' },
      { value: 5, label: 'Transformational Impact', description: 'Industry-leading changes (Market level)' }
    ]
  },
  return_on_investment: {
    title: 'Return on Investment',
    description: 'Measures the financial return compared to the investment in the innovation',
    levels: [
      { value: 1, label: 'Negative ROI', description: 'Cost outweigh benefits' },
      { value: 2, label: 'Marginal ROI', description: 'Benefits slightly exceed costs' },
      { value: 3, label: 'Neutral ROI', description: 'Benefits equal costs' },
      { value: 4, label: 'Positive ROI', description: 'Benefits significantly exceed costs' },
      { value: 5, label: 'Exceptional ROI', description: 'Outstanding financial performance and benefits' }
    ]
  }
}; 