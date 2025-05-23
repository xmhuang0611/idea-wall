import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { IdeaService } from '../../services/idea.service';
import { ReviewService } from '../../services/review.service';
import { Idea, ReviewStatus } from '../../models/idea.model';
import { FeelingUtilService } from '../../shared/services/feeling-util.service';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { ReviewListComponent } from '../review-list/review-list.component';

@Component({
  selector: 'app-session-idea-details',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DividerModule,
    TagModule,
    ProgressSpinnerModule,
    TabViewModule,
    DialogModule,
    ReviewFormComponent,
    ReviewListComponent
  ],
  template: `
    <div class="container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <p-progressSpinner></p-progressSpinner>
      </div>

      <!-- Idea Details -->
      <div *ngIf="!isLoading && idea" class="content-container">
        <!-- Header with back button -->
        <div class="flex justify-content-between align-items-center mb-3">
          <h1 class="text-2xl font-bold">Session Idea Details</h1>
          <button pButton icon="pi pi-arrow-left" label="Back to Session List" class="p-button-rounded" (click)="goBack()"></button>
        </div>

        <!-- Tabs for different sections -->
        <p-tabView>
          <!-- Idea Details Tab -->
          <p-tabPanel header="Idea Details">
            <!-- Idea Information Card -->
            <p-card styleClass="mb-4">
              <ng-template pTemplate="header">
                <div class="flex justify-content-between align-items-center p-3 bg-primary-50">
                  <div class="flex align-items-center gap-3">
                    <img [src]="feelingUtil.getFeelingImage(idea.feeling)" [alt]="feelingUtil.getFeelingLabel(idea.feeling)"
                      class="feeling-image" width="40" height="40" [title]="feelingUtil.getFeelingLabel(idea.feeling)">
                    <h2 class="text-xl font-bold m-0">{{idea.title}}</h2>
                  </div>
                  <p-tag 
                    *ngIf="idea.session_review?.status" 
                    [value]="getReviewStatusLabel(idea.session_review?.status)" 
                    [severity]="getReviewStatusSeverity(idea.session_review?.status)"
                    [rounded]="true">
                  </p-tag>
                </div>
              </ng-template>

              <div class="grid">
                <!-- Left Column -->
                <div class="col-12 md:col-6">
                  <h3 class="font-bold mb-2">Idea Information</h3>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Description</label>
                    <div class="p-2 border-1 border-round surface-ground white-space-pre-line">{{idea.description}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Created By</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.creator_name}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Created At</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.created_at | date:'MMM d, y h:mm a'}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Tags</label>
                    <div class="p-2 border-1 border-round surface-ground">
                      <div class="flex flex-wrap">
                        <p-tag *ngFor="let tag of idea.tag_details || []" [value]="tag?.tag_name || ''" severity="info"
                          styleClass="mr-1 mb-1" [rounded]="true">
                        </p-tag>
                        <span *ngIf="!idea.tag_details || idea.tag_details.length === 0" class="text-500">No tags</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right Column - Session Review Info -->
                <div class="col-12 md:col-6" *ngIf="idea.session_review">
                  <h3 class="font-bold mb-2">Session Review Information</h3>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Submitter Job</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.session_review.submitter_job || '-'}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Manager</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.session_review.manager || '-'}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Stream</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.session_review.stream || '-'}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Clients</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.session_review.clients || '-'}}</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Submitted At</label>
                    <div class="p-2 border-1 border-round surface-ground">
                      {{idea.session_review.submitted_at ? (idea.session_review.submitted_at | date:'MMM d, y h:mm a') : '-'}}
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-500 mb-1">Review Count</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.session_review.review_count}}</div>
                  </div>
                  
                  <div class="mb-3" *ngIf="idea.session_review.average_score">
                    <label class="block text-sm font-medium text-500 mb-1">Average Score</label>
                    <div class="p-2 border-1 border-round surface-ground">{{idea.session_review.average_score}}</div>
                  </div>
                </div>
              </div>

              <!-- Problem, Solutions and Values -->
              <div *ngIf="idea.session_review">
                <p-divider></p-divider>
                
                <div class="mb-3">
                  <label class="block text-md font-bold mb-1">Problem Statements</label>
                  <div class="p-3 border-1 border-round surface-ground white-space-pre-line">{{idea.session_review.problem_statements || '-'}}</div>
                </div>
                
                <div class="mb-3">
                  <label class="block text-md font-bold mb-1">Solutions</label>
                  <div class="p-3 border-1 border-round surface-ground white-space-pre-line">{{idea.session_review.solutions || '-'}}</div>
                </div>
                
                <div class="mb-3">
                  <label class="block text-md font-bold mb-1">Value to Business</label>
                  <div class="p-3 border-1 border-round surface-ground white-space-pre-line">{{idea.session_review.values || '-'}}</div>
                </div>
              </div>
            </p-card>
          </p-tabPanel>
          
          <!-- Reviews Tab -->
          <p-tabPanel header="Reviews ({{reviews.length}})">
            <div class="mb-4 flex justify-content-end">
              <button 
                pButton 
                label="Add Review" 
                icon="pi pi-plus" 
                class="p-button-rounded" 
                (click)="openReviewDialog()">
              </button>
            </div>
          
            <!-- Review List Component -->
            <app-review-list 
              [ideaId]="ideaId" 
              #reviewList>
            </app-review-list>
          </p-tabPanel>
        </p-tabView>
      </div>

      <!-- Not Found -->
      <div *ngIf="!isLoading && !idea" class="flex flex-column align-items-center my-6">
        <i class="pi pi-exclamation-circle text-5xl text-yellow-500 mb-3"></i>
        <h2 class="text-xl font-bold">Idea Not Found</h2>
        <p class="text-500">The requested idea could not be found or you don't have permission to view it.</p>
        <button pButton icon="pi pi-arrow-left" label="Back to Session List" class="p-button-rounded mt-3" (click)="goBack()"></button>
      </div>
    </div>
    
    <!-- Review Dialog -->
    <p-dialog 
      [(visible)]="showReviewDialog" 
      [style]="{width: '90%', maxWidth: '800px'}" 
      [modal]="true"
      [closeOnEscape]="true"
      [closable]="true"
      [draggable]="false"
      header="Review Idea">
      
      <app-review-form 
        [ideaId]="ideaId"
        (reviewSubmitted)="onReviewSubmitted($event)">
      </app-review-form>
    </p-dialog>
  `,
  styleUrls: ['./session-idea-details.component.scss']
})
export class SessionIdeaDetailsComponent implements OnInit {
  @ViewChild('reviewList') reviewList?: ReviewListComponent;
  
  ideaId: string = '';
  idea: Idea | null = null;
  isLoading: boolean = true;
  showReviewDialog: boolean = false;
  canUserAddReview: boolean = false;
  reviews: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ideaService: IdeaService,
    private reviewService: ReviewService,
    public feelingUtil: FeelingUtilService
  ) {}

  ngOnInit(): void {
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.ideaId = params['id'];
        this.loadIdeaDetails();
      } else {
        this.router.navigate(['/idea-session']);
      }
    });
  }

  loadIdeaDetails(): void {
    this.isLoading = true;
    this.ideaService.getIdeaById(this.ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.idea = response.data;
          // Convert date strings to Date objects
          if (this.idea) {
            this.idea.created_at = new Date(this.idea.created_at);
            this.idea.updated_at = new Date(this.idea.updated_at);
            if (this.idea.session_review?.submitted_at) {
              this.idea.session_review.submitted_at = new Date(this.idea.session_review.submitted_at);
            }
            
            // Load reviews
            this.loadReviews();
          }
        } else {
          this.router.navigate(['/idea-session']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading idea details:', error);
        this.isLoading = false;
        this.router.navigate(['/idea-session']);
      }
    });
  }
  
  loadReviews(): void {
    this.reviewService.getReviews(this.ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviews = response.data;
        }
      }
    });
  }

  getReviewStatusSeverity(status: ReviewStatus | undefined): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (!status) return 'info';
    
    switch (status) {
      case ReviewStatus.APPROVED:
        return 'success';
      case ReviewStatus.REJECTED:
        return 'danger';
      case ReviewStatus.IN_REVIEW:
      default:
        return 'info';
    }
  }

  getReviewStatusLabel(status: ReviewStatus | undefined): string {
    if (!status) return 'In Review';
    
    switch (status) {
      case ReviewStatus.APPROVED:
        return 'Approved';
      case ReviewStatus.REJECTED:
        return 'Rejected';
      case ReviewStatus.IN_REVIEW:
      default:
        return 'In Review';
    }
  }

  goBack(): void {
    this.router.navigate(['/idea-session']);
  }
  
  openReviewDialog(): void {
    this.showReviewDialog = true;
  }
  
  onReviewSubmitted(success: boolean): void {
    if (success) {
      this.showReviewDialog = false;
      this.loadReviews();
      // Refresh review list component
      if (this.reviewList) {
        this.reviewList.refresh();
      }
    }
  }
} 