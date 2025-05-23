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
      <p-card styleClass="mb-4">
        <ng-template pTemplate="title">
          <div class="text-xl font-bold">Review Scoring</div>
        </ng-template>
        
        <ng-template pTemplate="subtitle">
          <p class="text-500">Please score each criterion from 1-5 and provide comments.</p>
        </ng-template>
        
        <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
          <!-- Innovation -->
          <div class="mb-4 review-category">
            <div class="grid">
              <div class="col-12 md:col-4">
                <label for="innovation_score" class="block mb-2 font-semibold">{{ criteria.innovation.title }} <span class="text-red-500">*</span></label>
                <p-dropdown 
                  id="innovation_score"
                  formControlName="innovation_score"
                  [options]="scoreOptions"
                  placeholder="Select score"
                  optionLabel="label"
                  optionValue="value"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('innovation_score')?.invalid && reviewForm.get('innovation_score')?.touched}">
                </p-dropdown>
                <small class="text-gray-500">{{ criteria.innovation.description }}</small>
                <small 
                  class="p-error block" 
                  *ngIf="reviewForm.get('innovation_score')?.invalid && reviewForm.get('innovation_score')?.touched">
                  Score is required
                </small>
              </div>
              <div class="col-12 md:col-8">
                <label for="innovation_comment" class="block mb-2 font-semibold">Comments</label>
                <textarea 
                  id="innovation_comment"
                  pInputTextarea 
                  formControlName="innovation_comment"
                  [rows]="3"
                  placeholder="Please provide your comments for innovation score"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('innovation_comment')?.invalid && reviewForm.get('innovation_comment')?.touched}">
                </textarea>
                <div *ngIf="reviewForm.value.innovation_score" class="mt-2 p-2 bg-blue-50 border-round">
                  <small class="text-blue-700">{{ getScoreDescription('innovation', reviewForm.value.innovation_score) }}</small>
                </div>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Value Creation -->
          <div class="mb-4 review-category">
            <div class="grid">
              <div class="col-12 md:col-4">
                <label for="value_score" class="block mb-2 font-semibold">{{ criteria.value.title }} <span class="text-red-500">*</span></label>
                <p-dropdown 
                  id="value_score"
                  formControlName="value_score"
                  [options]="scoreOptions"
                  placeholder="Select score"
                  optionLabel="label"
                  optionValue="value"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('value_score')?.invalid && reviewForm.get('value_score')?.touched}">
                </p-dropdown>
                <small class="text-gray-500">{{ criteria.value.description }}</small>
                <small 
                  class="p-error block" 
                  *ngIf="reviewForm.get('value_score')?.invalid && reviewForm.get('value_score')?.touched">
                  Score is required
                </small>
              </div>
              <div class="col-12 md:col-8">
                <label for="value_comment" class="block mb-2 font-semibold">Comments</label>
                <textarea 
                  id="value_comment"
                  pInputTextarea 
                  formControlName="value_comment"
                  [rows]="3"
                  placeholder="Please provide your comments for value creation score"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('value_comment')?.invalid && reviewForm.get('value_comment')?.touched}">
                </textarea>
                <div *ngIf="reviewForm.value.value_score" class="mt-2 p-2 bg-blue-50 border-round">
                  <small class="text-blue-700">{{ getScoreDescription('value', reviewForm.value.value_score) }}</small>
                </div>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Feasibility -->
          <div class="mb-4 review-category">
            <div class="grid">
              <div class="col-12 md:col-4">
                <label for="feasibility_score" class="block mb-2 font-semibold">{{ criteria.feasibility.title }} <span class="text-red-500">*</span></label>
                <p-dropdown 
                  id="feasibility_score"
                  formControlName="feasibility_score"
                  [options]="scoreOptions"
                  placeholder="Select score"
                  optionLabel="label"
                  optionValue="value"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('feasibility_score')?.invalid && reviewForm.get('feasibility_score')?.touched}">
                </p-dropdown>
                <small class="text-gray-500">{{ criteria.feasibility.description }}</small>
                <small 
                  class="p-error block" 
                  *ngIf="reviewForm.get('feasibility_score')?.invalid && reviewForm.get('feasibility_score')?.touched">
                  Score is required
                </small>
              </div>
              <div class="col-12 md:col-8">
                <label for="feasibility_comment" class="block mb-2 font-semibold">Comments</label>
                <textarea 
                  id="feasibility_comment"
                  pInputTextarea 
                  formControlName="feasibility_comment"
                  [rows]="3"
                  placeholder="Please provide your comments for feasibility score"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('feasibility_comment')?.invalid && reviewForm.get('feasibility_comment')?.touched}">
                </textarea>
                <div *ngIf="reviewForm.value.feasibility_score" class="mt-2 p-2 bg-blue-50 border-round">
                  <small class="text-blue-700">{{ getScoreDescription('feasibility', reviewForm.value.feasibility_score) }}</small>
                </div>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Impact -->
          <div class="mb-4 review-category">
            <div class="grid">
              <div class="col-12 md:col-4">
                <label for="impact_score" class="block mb-2 font-semibold">{{ criteria.impact.title }} <span class="text-red-500">*</span></label>
                <p-dropdown 
                  id="impact_score"
                  formControlName="impact_score"
                  [options]="scoreOptions"
                  placeholder="Select score"
                  optionLabel="label"
                  optionValue="value"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('impact_score')?.invalid && reviewForm.get('impact_score')?.touched}">
                </p-dropdown>
                <small class="text-gray-500">{{ criteria.impact.description }}</small>
                <small 
                  class="p-error block" 
                  *ngIf="reviewForm.get('impact_score')?.invalid && reviewForm.get('impact_score')?.touched">
                  Score is required
                </small>
              </div>
              <div class="col-12 md:col-8">
                <label for="impact_comment" class="block mb-2 font-semibold">Comments</label>
                <textarea 
                  id="impact_comment"
                  pInputTextarea 
                  formControlName="impact_comment"
                  [rows]="3"
                  placeholder="Please provide your comments for impact score"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('impact_comment')?.invalid && reviewForm.get('impact_comment')?.touched}">
                </textarea>
                <div *ngIf="reviewForm.value.impact_score" class="mt-2 p-2 bg-blue-50 border-round">
                  <small class="text-blue-700">{{ getScoreDescription('impact', reviewForm.value.impact_score) }}</small>
                </div>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Return on Investment -->
          <div class="mb-4 review-category">
            <div class="grid">
              <div class="col-12 md:col-4">
                <label for="return_on_investment_score" class="block mb-2 font-semibold">{{ criteria.return_on_investment.title }} <span class="text-red-500">*</span></label>
                <p-dropdown 
                  id="return_on_investment_score"
                  formControlName="return_on_investment_score"
                  [options]="scoreOptions"
                  placeholder="Select score"
                  optionLabel="label"
                  optionValue="value"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('return_on_investment_score')?.invalid && reviewForm.get('return_on_investment_score')?.touched}">
                </p-dropdown>
                <small class="text-gray-500">{{ criteria.return_on_investment.description }}</small>
                <small 
                  class="p-error block" 
                  *ngIf="reviewForm.get('return_on_investment_score')?.invalid && reviewForm.get('return_on_investment_score')?.touched">
                  Score is required
                </small>
              </div>
              <div class="col-12 md:col-8">
                <label for="return_on_investment_comment" class="block mb-2 font-semibold">Comments</label>
                <textarea 
                  id="return_on_investment_comment"
                  pInputTextarea 
                  formControlName="return_on_investment_comment"
                  [rows]="3"
                  placeholder="Please provide your comments for ROI score"
                  [ngClass]="{'ng-invalid ng-dirty': reviewForm.get('return_on_investment_comment')?.invalid && reviewForm.get('return_on_investment_comment')?.touched}">
                </textarea>
                <div *ngIf="reviewForm.value.return_on_investment_score" class="mt-2 p-2 bg-blue-50 border-round">
                  <small class="text-blue-700">{{ getScoreDescription('return_on_investment', reviewForm.value.return_on_investment_score) }}</small>
                </div>
              </div>
            </div>
          </div>

          <p-divider></p-divider>
          
          <!-- Average Score Display -->
          <div class="mb-4 p-3 bg-gray-50 border-round">
            <div class="flex justify-content-between align-items-center">
              <span class="font-semibold">Average Score:</span>
              <span class="text-xl font-bold text-primary">{{ calculateAverageScore().toFixed(1) }}</span>
            </div>
          </div>
          
          <!-- Submit Button -->
          <div class="flex justify-content-end">
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
      </p-card>
    </div>
  `,
  styles: [`
    .review-category {
      border: 1px solid var(--surface-200);
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      background: var(--surface-0);
    }
    
    :host ::ng-deep {
      .p-dropdown {
        width: 100%;
      }
      
      .bg-blue-50 {
        background-color: #eff6ff;
      }
      
      .text-blue-700 {
        color: #1d4ed8;
      }
      
      .bg-gray-50 {
        background-color: #f9fafb;
      }
    }
  `]
})
export class ReviewFormComponent implements OnInit {
  @Input() ideaId: string = '';
  @Input() targetType: string = 'Session';
  @Output() reviewSubmitted = new EventEmitter<boolean>();
  
  reviewForm: FormGroup;
  isSubmitting: boolean = false;
  criteria = REVIEW_CRITERIA;
  
  scoreOptions = [
    { label: 'Select Score', value: null },
    { label: '1 - Poor', value: 1 },
    { label: '2 - Below Average', value: 2 },
    { label: '3 - Average', value: 3 },
    { label: '4 - Good', value: 4 },
    { label: '5 - Excellent', value: 5 }
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
  
  getScoreDescription(criterion: string, score: number): string {
    if (!score) return '';
    const criteriaData = this.criteria[criterion as keyof typeof this.criteria];
    if (!criteriaData) return '';
    const level = criteriaData.levels.find(l => l.value === score);
    return level ? `${level.label}: ${level.description}` : '';
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