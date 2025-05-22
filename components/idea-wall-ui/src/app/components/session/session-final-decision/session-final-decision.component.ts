import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { RatingModule } from 'primeng/rating';
import { AccordionModule } from 'primeng/accordion';
import { ToastService } from '../../../shared/services/toast.service';
import { SessionService } from '../../../services/session.service';
import { AuthService } from '../../../auth/auth.service';
import { IdeaSession, SessionReview } from '../../../models/session.model';
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-session-final-decision',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextareaModule,
    RadioButtonModule,
    CheckboxModule,
    RatingModule,
    AccordionModule
  ],
  templateUrl: './session-final-decision.component.html',
  styleUrls: ['./session-final-decision.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionFinalDecisionComponent implements OnInit {
  sessionId: string | null = null;
  session: IdeaSession | null = null;
  reviews: SessionReview[] = [];
  
  loading: boolean = true;
  reviewsLoading: boolean = false;
  submitting: boolean = false;
  
  decisionForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.decisionForm = this.fb.group({
      decision: ['APPROVED', Validators.required],
      comments: ['', Validators.required],
      allow_resubmit: [true]
    });
  }
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('id');
      if (this.sessionId) {
        this.loadSessionDetails(this.sessionId);
      } else {
        this.toastService.showError('Session ID is missing');
        this.router.navigate(['/sessions']);
      }
    });
  }
  
  loadSessionDetails(sessionId: string): void {
    this.loading = true;
    
    this.sessionService.getSessionById(sessionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.session = response.data;
          this.loadReviews(sessionId);
        } else {
          this.toastService.showError('Failed to load session details');
          this.router.navigate(['/sessions']);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading session', error);
        this.toastService.showError('Failed to load session details');
        this.router.navigate(['/sessions']);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  loadReviews(sessionId: string): void {
    this.reviewsLoading = true;
    
    this.sessionService.getSessionReviews(sessionId).subscribe({
      next: (response) => {
        this.reviewsLoading = false;
        if (response.success && response.data) {
          this.reviews = response.data;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.reviewsLoading = false;
        console.error('Error loading reviews', error);
        this.cdr.markForCheck();
      }
    });
  }
  
  canMakeFinalDecision(): boolean {
    if (!this.session || !this.authService.isLoggedIn()) {
      return false;
    }
    
    // Cannot make a decision if a final decision has already been made
    if (this.session.has_final_decision) {
      return false;
    }
    
    // The number of reviews must meet the minimum requirement
    return this.session.review_count >= this.session.min_required_reviews;
  }
  
  submitFinalDecision(): void {
    if (this.decisionForm.invalid) {
      Object.keys(this.decisionForm.controls).forEach(key => {
        const control = this.decisionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    if (!this.session || !this.sessionId) {
      this.toastService.showError('Session data is missing');
      return;
    }
    
    this.submitting = true;
    const decisionData = this.decisionForm.value;
    
    // 如果决定是APPROVED，总是设置allow_resubmit为false
    if (decisionData.decision === 'APPROVED') {
      decisionData.allow_resubmit = false;
    }
    
    this.sessionService.submitFinalDecision(this.sessionId, {
      session_id: this.sessionId,
      reviewer_id: this.authService.getId(),
      decision: decisionData.decision,
      comments: decisionData.comments,
      allow_resubmit: decisionData.allow_resubmit
    }).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.toastService.showSuccess('Final decision submitted successfully');
          this.router.navigate(['/sessions', this.sessionId]);
        } else {
          this.toastService.showError('Failed to submit final decision');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error submitting final decision', error);
        this.toastService.showError('Failed to submit final decision');
        this.cdr.markForCheck();
      }
    });
  }
  
  calculateAverageScore(review: SessionReview): number {
    const scores = [
      review.innovation_score,
      review.value_score,
      review.feasibility_score,
      review.impact_score,
      review.roi_score
    ];
    
    const sum = scores.reduce((a, b) => a + b, 0);
    return parseFloat((sum / scores.length).toFixed(1));
  }
  
  goBack(): void {
    this.router.navigate(['/sessions', this.sessionId]);
  }
} 