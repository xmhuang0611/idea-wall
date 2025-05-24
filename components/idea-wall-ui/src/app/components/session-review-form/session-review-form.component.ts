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
import { SessionReview } from '../../models/idea.model';
import { IdeaService } from '../../services/idea.service';
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
    ProgressSpinnerModule
  ],
  templateUrl: './session-review-form.component.html',
  styleUrls: ['./session-review-form.component.scss']
})
export class SessionReviewFormComponent implements OnInit {
  ideaId: string | null = null;
  sessionReviewForm!: FormGroup;
  isSubmitting = false;
  ideaTitle: string = '';

  constructor(
    private fb: FormBuilder,
    private ideaService: IdeaService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getIdeaDetails();
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

  private getIdeaDetails(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.ideaId = params['id'];
        
        if (this.ideaId) {
          this.ideaService.getIdeaById(this.ideaId).subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.ideaTitle = response.data.title;
              }
            },
            error: (error) => {
              console.error('Error fetching idea details:', error);
            }
          });
        }
      }
    });
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

    this.ideaService.submitSessionReview(this.ideaId, sessionReviewData)
      .subscribe({
        next: (response) => {
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
    this.router.navigate(['/']);
  }
} 