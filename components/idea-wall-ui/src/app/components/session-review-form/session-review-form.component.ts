import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { SessionReview } from '../../models/idea.model';
import { IdeaService } from '../../services/idea.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-session-review-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CardModule,
    ToastModule,
    ProgressSpinnerModule,
    BreadcrumbModule
  ],
  templateUrl: './session-review-form.component.html',
  styleUrls: ['./session-review-form.component.scss']
})
export class SessionReviewFormComponent implements OnInit {
  @Input() ideaId: string | null = null;
  @Input() existingSessionReview: SessionReview | null = null;
  @Output() sessionReviewSubmitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  sessionReviewForm!: FormGroup;
  isSubmitting = false;
  ideaTitle: string = '';
  isEditMode = false;

  // Breadcrumb items
  breadcrumbItems: MenuItem[] = [];
  homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor(
    private fb: FormBuilder,
    private ideaService: IdeaService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Initialize form in constructor to ensure it's available before template renders
    this.initForm();
  }

  ngOnInit(): void {
    this.getIdeaDetails();
  }

  private getIdeaDetails(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.ideaId = params['id'];
        this.loadIdeaWithSessionReview();
      }
    });
  }

  private initForm(): void {
    this.sessionReviewForm = this.fb.group({
      submitter_job: ['', Validators.required],
      manager: ['', Validators.required],
      stream: ['', Validators.required],
      clients: [''],
      problem_statements: ['', Validators.required],
      solutions: ['', Validators.required],
      values: ['', Validators.required]
    });
  }

  private populateFormWithExistingData(): void {
    if (this.existingSessionReview) {
      this.sessionReviewForm.patchValue({
        submitter_job: this.existingSessionReview.submitter_job || '',
        manager: this.existingSessionReview.manager || '',
        stream: this.existingSessionReview.stream || '',
        clients: this.existingSessionReview.clients || '',
        problem_statements: this.existingSessionReview.problem_statements || '',
        solutions: this.existingSessionReview.solutions || '',
        values: this.existingSessionReview.values || ''
      });
    }
  }

  private loadIdeaWithSessionReview(): void {
    if (this.ideaId) {
      this.ideaService.getIdeaById(this.ideaId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.ideaTitle = response.data.title;
            this.updateBreadcrumb();
            
            // Check if there's existing session review data
            if (response.data.session_review) {
              this.existingSessionReview = response.data.session_review;
              this.isEditMode = true;
              this.populateFormWithExistingData();
            } else {
              this.isEditMode = false;
            }
          }
        },
        error: (error) => {
          console.error('Error fetching idea details:', error);
        }
      });
    }
  }

  private updateBreadcrumb(): void {
    if (this.ideaTitle) {
      this.breadcrumbItems = [
        { label: 'Ideas', routerLink: '/' },
        { label: this.ideaTitle, routerLink: ['/idea', this.ideaId] },
        { label: this.isEditMode ? 'Resubmit Session Review' : 'Submit Session Review' }
      ];
    }
  }

  onSubmit(): void {
    if (this.sessionReviewForm.invalid) {
      Object.keys(this.sessionReviewForm.controls).forEach(key => {
        const control = this.sessionReviewForm.get(key);
        if (control) {
          control.markAsDirty();
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.ideaId) {
      return;
    }

    this.isSubmitting = true;
    
    const sessionReviewData = this.sessionReviewForm.value;

    // Use different API endpoint based on mode
    const submitObservable = this.isEditMode 
      ? this.reviewService.resubmitSessionReview(this.ideaId, sessionReviewData)
      : this.reviewService.submitSessionReview(this.ideaId, sessionReviewData);

    submitObservable.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.router.navigate(['/idea-session']);
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error submitting session review:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/idea-session']);
    } else {
      this.router.navigate(['/idea', this.ideaId]);
    }
  }
} 