import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { IdeaService } from '../../services/idea.service';
import { ReviewService } from '../../services/review.service';
import { Idea, LeanCanvas } from '../../models/idea.model';
import { ApiResponse } from '../../shared/models/api-response.model';

@Component({
  selector: 'app-incubator-review-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    ProgressSpinnerModule,
    BreadcrumbModule
  ],
  templateUrl: './incubator-review-form.component.html',
  styleUrls: ['./incubator-review-form.component.scss']
})
export class IncubatorReviewFormComponent implements OnInit {
  idea: Idea | null = null;
  leanCanvasForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  // Breadcrumb items
  breadcrumbItems: MenuItem[] = [];
  homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private ideaService: IdeaService,
    private reviewService: ReviewService
  ) {
    this.leanCanvasForm = this.fb.group({
      problem: ['', Validators.required],
      existing_alternatives: [''],
      solution: ['', Validators.required],
      key_metrics: [''],
      unique_value: ['', Validators.required],
      high_level_concept: [''],
      unfair_advantage: [''],
      channels: [''],
      customer_segments: ['', Validators.required],
      early_adopters: [''],
      cost_structure: [''],
      revenue_stream: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadIdeaDetails();
  }

  private loadIdeaDetails(): void {
    this.route.params.subscribe(params => {
      const sessionId = params['id'];
      if (sessionId) {
        this.isLoading = true;
        
        this.ideaService.getIdeaById(sessionId).subscribe({
          next: (response: ApiResponse<Idea>) => {
            if (response.success && response.data) {
              this.idea = response.data;
              this.updateBreadcrumb();
              
              // Pre-fill form if lean canvas data exists
              if (this.idea.incubator_review?.lean_canvas) {
                this.leanCanvasForm.patchValue(this.idea.incubator_review.lean_canvas);
              }
            }
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error loading idea details:', error);
            this.isLoading = false;
          }
        });
      }
    });
  }

  private updateBreadcrumb(): void {
    if (this.idea) {
      this.breadcrumbItems = [
        { label: 'Ideas', routerLink: '/' },
        { label: 'Idea Session', routerLink: '/idea-session' },
        { label: this.idea.title, routerLink: ['/idea-session', this.idea.id] },
        { label: 'Submit to Incubator' }
      ];
    }
  }

  onSubmit(): void {
    if (this.leanCanvasForm.invalid || !this.idea) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const leanCanvasData: LeanCanvas = this.leanCanvasForm.value;

    this.reviewService.submitIncubatorReview(this.idea.id, leanCanvasData).subscribe({
      next: (response: ApiResponse<Idea>) => {
        if (response.success) {
          this.router.navigate(['/idea-incubator']);
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error submitting incubator review:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/idea-session']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.leanCanvasForm.controls).forEach(key => {
      const control = this.leanCanvasForm.get(key);
      if (control) {
        control.markAsDirty();
        control.markAsTouched();
      }
    });
  }
}
