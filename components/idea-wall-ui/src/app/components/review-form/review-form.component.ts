import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ReviewService } from '../../services/review.service';
import { ReviewResult, REVIEW_CRITERIA } from '../../models/review.model';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextareaModule,
    ButtonModule,
    DropdownModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  template: `
    <div class="review-form-container">
      <div class="form-header">
        <p class="form-subtitle">Please score each criterion from 1-5 and provide comments.</p>
      </div>
      
      <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
        <!-- Innovation -->
        <div class="review-criterion">
          <div class="criterion-header">
            <div class="criterion-title">
              <span class="title-text">Innovation</span>
              <i class="pi pi-info-circle info-icon" 
                 [pTooltip]="criteriaDescriptions.innovation"
                 tooltipPosition="right"></i>
              <span class="required">*</span>
            </div>
          </div>
          
          <div class="criterion-content">
            <div class="score-section">
              <label for="innovation_score" class="score-label">Score</label>
              <p-dropdown 
                id="innovation_score"
                formControlName="innovation_score"
                [options]="innovationOptions"
                placeholder="Select score"
                optionLabel="label"
                optionValue="value"
                [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('innovation_score')?.invalid && reviewForm.get('innovation_score')?.touched}"
                styleClass="score-dropdown">
              </p-dropdown>
              <small 
                class="p-error" 
                *ngIf="reviewForm.get('innovation_score')?.invalid && reviewForm.get('innovation_score')?.touched">
                Score is required
              </small>
            </div>
            
            <div class="comment-section">
              <label for="innovation_comment" class="comment-label">Comments</label>
              <textarea 
                id="innovation_comment"
                pInputTextarea 
                formControlName="innovation_comment"
                [rows]="3"
                placeholder="Please provide your comments for innovation score"
                class="comment-textarea">
              </textarea>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Value Creation -->
        <div class="review-criterion">
          <div class="criterion-header">
            <div class="criterion-title">
              <span class="title-text">Value Creation</span>
              <i class="pi pi-info-circle info-icon" 
                 [pTooltip]="criteriaDescriptions.value"
                 tooltipPosition="right"></i>
              <span class="required">*</span>
            </div>
          </div>
          
          <div class="criterion-content">
            <div class="score-section">
              <label for="value_score" class="score-label">Score</label>
              <p-dropdown 
                id="value_score"
                formControlName="value_score"
                [options]="valueOptions"
                placeholder="Select score"
                optionLabel="label"
                optionValue="value"
                [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('value_score')?.invalid && reviewForm.get('value_score')?.touched}"
                styleClass="score-dropdown">
              </p-dropdown>
              <small 
                class="p-error" 
                *ngIf="reviewForm.get('value_score')?.invalid && reviewForm.get('value_score')?.touched">
                Score is required
              </small>
            </div>
            
            <div class="comment-section">
              <label for="value_comment" class="comment-label">Comments</label>
              <textarea 
                id="value_comment"
                pInputTextarea 
                formControlName="value_comment"
                [rows]="3"
                placeholder="Please provide your comments for value creation score"
                class="comment-textarea">
              </textarea>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Feasibility -->
        <div class="review-criterion">
          <div class="criterion-header">
            <div class="criterion-title">
              <span class="title-text">Feasibility</span>
              <i class="pi pi-info-circle info-icon" 
                 [pTooltip]="criteriaDescriptions.feasibility"
                 tooltipPosition="right"></i>
              <span class="required">*</span>
            </div>
          </div>
          
          <div class="criterion-content">
            <div class="score-section">
              <label for="feasibility_score" class="score-label">Score</label>
              <p-dropdown 
                id="feasibility_score"
                formControlName="feasibility_score"
                [options]="feasibilityOptions"
                placeholder="Select score"
                optionLabel="label"
                optionValue="value"
                [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('feasibility_score')?.invalid && reviewForm.get('feasibility_score')?.touched}"
                styleClass="score-dropdown">
              </p-dropdown>
              <small 
                class="p-error" 
                *ngIf="reviewForm.get('feasibility_score')?.invalid && reviewForm.get('feasibility_score')?.touched">
                Score is required
              </small>
            </div>
            
            <div class="comment-section">
              <label for="feasibility_comment" class="comment-label">Comments</label>
              <textarea 
                id="feasibility_comment"
                pInputTextarea 
                formControlName="feasibility_comment"
                [rows]="3"
                placeholder="Please provide your comments for feasibility score"
                class="comment-textarea">
              </textarea>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Impact -->
        <div class="review-criterion">
          <div class="criterion-header">
            <div class="criterion-title">
              <span class="title-text">Impact</span>
              <i class="pi pi-info-circle info-icon" 
                 [pTooltip]="criteriaDescriptions.impact"
                 tooltipPosition="right"></i>
              <span class="required">*</span>
            </div>
          </div>
          
          <div class="criterion-content">
            <div class="score-section">
              <label for="impact_score" class="score-label">Score</label>
              <p-dropdown 
                id="impact_score"
                formControlName="impact_score"
                [options]="impactOptions"
                placeholder="Select score"
                optionLabel="label"
                optionValue="value"
                [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('impact_score')?.invalid && reviewForm.get('impact_score')?.touched}"
                styleClass="score-dropdown">
              </p-dropdown>
              <small 
                class="p-error" 
                *ngIf="reviewForm.get('impact_score')?.invalid && reviewForm.get('impact_score')?.touched">
                Score is required
              </small>
            </div>
            
            <div class="comment-section">
              <label for="impact_comment" class="comment-label">Comments</label>
              <textarea 
                id="impact_comment"
                pInputTextarea 
                formControlName="impact_comment"
                [rows]="3"
                placeholder="Please provide your comments for impact score"
                class="comment-textarea">
              </textarea>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Return on Investment -->
        <div class="review-criterion">
          <div class="criterion-header">
            <div class="criterion-title">
              <span class="title-text">Return on Investment (ROI)</span>
              <i class="pi pi-info-circle info-icon" 
                 [pTooltip]="criteriaDescriptions.roi"
                 tooltipPosition="right"></i>
              <span class="required">*</span>
            </div>
          </div>
          
          <div class="criterion-content">
            <div class="score-section">
              <label for="roi_score" class="score-label">Score</label>
              <p-dropdown 
                id="roi_score"
                formControlName="return_on_investment_score"
                [options]="roiOptions"
                placeholder="Select score"
                optionLabel="label"
                optionValue="value"
                [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('return_on_investment_score')?.invalid && reviewForm.get('return_on_investment_score')?.touched}"
                styleClass="score-dropdown">
              </p-dropdown>
              <small 
                class="p-error" 
                *ngIf="reviewForm.get('return_on_investment_score')?.invalid && reviewForm.get('return_on_investment_score')?.touched">
                Score is required
              </small>
            </div>
            
            <div class="comment-section">
              <label for="roi_comment" class="comment-label">Comments</label>
              <textarea 
                id="roi_comment"
                pInputTextarea 
                formControlName="return_on_investment_comment"
                [rows]="3"
                placeholder="Please provide your comments for ROI score"
                class="comment-textarea">
              </textarea>
            </div>
          </div>
        </div>

        <p-divider></p-divider>
        
        <!-- Average Score Display -->
        <div class="average-score-section">
          <div class="average-score-card">
            <span class="average-label">Average Score:</span>
            <span class="average-value">{{ calculateAverageScore().toFixed(1) }}/5.0</span>
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            pButton 
            type="button" 
            label="Cancel" 
            class="p-button-secondary p-button-rounded mr-2" 
            (click)="onCancel()"
            [disabled]="isSubmitting">
          </button>
          <button 
            pButton 
            type="submit" 
            [label]="isSubmitting ? 'Submitting...' : 'Submit Review'" 
            [disabled]="reviewForm.invalid || isSubmitting"
            [loading]="isSubmitting"
            class="p-button-rounded">
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .review-form-container {
      padding: 1rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .form-header {
      text-align: center;
      border-bottom: 1px solid var(--surface-200);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }

    .form-title {
      color: var(--text-color);
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .form-subtitle {
      color: var(--text-color-secondary);
      margin: 0;
      font-size: 0.9rem;
    }

    .review-criterion {
      border: 1px solid var(--surface-300);
      border-radius: 6px;
      background: var(--surface-0);
      margin-bottom: 1rem;
    }

    .criterion-header {
      background: var(--surface-100);
      border-bottom: 1px solid var(--surface-200);
      padding: 0.75rem 1rem;
      border-radius: 6px 6px 0 0;
    }

    .criterion-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-color);
    }

    .title-text {
      color: var(--text-color);
    }

    .info-icon {
      color: var(--primary-color);
      cursor: help;
      font-size: 0.9rem;
    }

    .required {
      color: var(--red-500);
      font-weight: bold;
    }

    .criterion-content {
      padding: 1rem;
    }

    .score-section {
      margin-bottom: 1rem;
    }

    .score-label {
      display: block;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.375rem;
      font-size: 0.9rem;
    }

    .comment-section {
      margin-bottom: 0;
    }

    .comment-label {
      display: block;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.375rem;
      font-size: 0.9rem;
    }

    .comment-textarea {
      width: 100%;
      resize: vertical;
      min-height: 70px;
    }

    .average-score-section {
      padding: 0.75rem 1rem;
      background: var(--surface-50);
      border-radius: 6px;
      border: 1px solid var(--surface-200);
      margin-bottom: 1rem;
    }

    .average-score-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .average-label {
      font-weight: 600;
      color: var(--text-color);
      font-size: 1rem;
    }

    .average-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    :host ::ng-deep {
      .score-dropdown {
        width: 100%;
      }

      .p-dropdown-panel .p-dropdown-items {
        max-height: 300px;
      }

      .p-tooltip .p-tooltip-text {
        max-width: 350px;
        line-height: 1.4;
      }

      .p-divider {
        margin: 0.75rem 0;
      }

      .p-divider .p-divider-content {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .review-form-container {
        padding: 0.75rem;
      }

      .criterion-content {
        padding: 0.75rem;
      }

      .form-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class ReviewFormComponent implements OnInit {
  @Input() ideaId: string = '';
  @Input() targetType: string = 'Session';
  @Output() reviewSubmitted = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();
  
  reviewForm: FormGroup;
  isSubmitting: boolean = false;
  criteria = REVIEW_CRITERIA;

  // Criteria descriptions for tooltips
  criteriaDescriptions = {
    innovation: 'Evaluate the level of innovation introduced by the idea.',
    value: 'Assesses the value created by the innovation, including economic value, efficiency improvement, enhancing user experience, data-driven insights, etc.',
    feasibility: 'Assesses the practicality and feasibility of implementing the idea.',
    impact: 'Assesses the potential impact of the innovation on users and the organization.',
    roi: 'Measures the financial return compared to the investment in the innovation.'
  };
  
  // Score options for each criterion matching the image
  innovationOptions = [
    { label: '1 - Not innovative, replicates existing solutions', value: 1 },
    { label: '2 - Incrementally innovative, minor improvements', value: 2 },
    { label: '3 - Moderately innovative, introduces new features', value: 3 },
    { label: '4 - Highly innovative, significant advancement', value: 4 },
    { label: '5 - Extremely innovative, revolutionary changes or breakthroughs', value: 5 }
  ];

  valueOptions = [
    { label: '1 - Minimal value, limited impact on users or business', value: 1 },
    { label: '2 - Some value, address specific needs', value: 2 },
    { label: '3 - Substantial value, improves efficiency or effectiveness', value: 3 },
    { label: '4 - Significant value, delivers tangible benefits', value: 4 },
    { label: '5 - Exceptional value, transformative impact, generates significant value', value: 5 }
  ];

  feasibilityOptions = [
    { label: '1 - Not feasible, significant technical or resource barriers', value: 1 },
    { label: '2 - Marginally feasible, challenges require major effort', value: 2 },
    { label: '3 - Moderately feasible, manageable challenges', value: 3 },
    { label: '4 - Feasible, minor challenges that can be overcome', value: 4 },
    { label: '5 - Highly feasible, minimal implementation challenges', value: 5 }
  ];

  impactOptions = [
    { label: '1 - Negligible impact, minimal effect (Project level)', value: 1 },
    { label: '2 - Limited impact, affects special areas (CSI level, multiple projects)', value: 2 },
    { label: '3 - Moderate impact, improves efficiency or user experience significantly (Organization level)', value: 3 },
    { label: '4 - Significant impact, transforms operations or strategy (FI level)', value: 4 },
    { label: '5 - Transformational impact, industry-leading changes (Market level)', value: 5 }
  ];

  roiOptions = [
    { label: '1 - Negative ROI, cost outweigh benefits', value: 1 },
    { label: '2 - Marginal ROI, benefits slightly exceed costs', value: 2 },
    { label: '3 - Neutral ROI, benefits equal costs', value: 3 },
    { label: '4 - Positive ROI, benefits significantly exceed costs', value: 4 },
    { label: '5 - Exceptional ROI, Outstanding financial performance and benefits', value: 5 }
  ];
  
  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService
  ) {
    this.reviewForm = this.fb.group({
      innovation_score: [null, Validators.required],
      innovation_comment: [''],
      value_score: [null, Validators.required],
      value_comment: [''],
      feasibility_score: [null, Validators.required],
      feasibility_comment: [''],
      impact_score: [null, Validators.required],
      impact_comment: [''],
      return_on_investment_score: [null, Validators.required],
      return_on_investment_comment: ['']
    });
  }
  
  ngOnInit(): void {
    // Initialize form
  }
  
  calculateAverageScore(): number {
    const scores = [
      this.reviewForm.value.innovation_score,
      this.reviewForm.value.value_score,
      this.reviewForm.value.feasibility_score,
      this.reviewForm.value.impact_score,
      this.reviewForm.value.return_on_investment_score
    ].filter(score => score !== null && score !== undefined);

    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  onCancel(): void {
    this.cancel.emit();
  }
  
  onSubmit(): void {
    // Validate form
    if (this.reviewForm.invalid) {
      Object.keys(this.reviewForm.controls).forEach(key => {
        const control = this.reviewForm.get(key);
        if (control) {
          control.markAsDirty();
          control.markAsTouched();
        }
      });
      return;
    }
    
    this.isSubmitting = true;
    
    const reviewData = this.reviewForm.value;

    // Build review result structure matching backend
    const reviewResult: ReviewResult = {
      innovation: {
        score: reviewData.innovation_score,
        comment: reviewData.innovation_comment
      },
      value: {
        score: reviewData.value_score,
        comment: reviewData.value_comment
      },
      feasibility: {
        score: reviewData.feasibility_score,
        comment: reviewData.feasibility_comment
      },
      impact: {
        score: reviewData.impact_score,
        comment: reviewData.impact_comment
      },
      return_on_investment: {
        score: reviewData.return_on_investment_score,
        comment: reviewData.return_on_investment_comment
      },
      average_score: this.calculateAverageScore()
    };
    
    this.reviewService.addReview(this.ideaId, this.targetType, reviewResult).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.reviewSubmitted.emit(true);
          this.reviewForm.reset();
        }
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        this.isSubmitting = false;
      }
    });
  }
}