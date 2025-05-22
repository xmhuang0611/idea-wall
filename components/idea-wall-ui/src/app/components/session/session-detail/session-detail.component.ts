import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastService } from '../../../shared/services/toast.service';
import { SessionService } from '../../../services/session.service';
import { IdeaService } from '../../../services/idea.service';
import { AuthService } from '../../../auth/auth.service';
import { IdeaSession, SessionReview, SessionStatus } from '../../../models/session.model';
import { Idea } from '../../../models/idea.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    TabViewModule,
    InputTextareaModule,
    TagModule,
    ChipModule,
    RatingModule,
    PanelModule,
    AccordionModule,
    ProgressBarModule,
    TimelineModule,
    DialogModule,
    CheckboxModule,
    RadioButtonModule
  ],
  template: `    <div class="container">      <div *ngIf="loading" class="flex justify-content-center py-6">        <i class="pi pi-spin pi-spinner text-2xl"></i>      </div>            <div *ngIf="!loading && session" class="surface-card p-4 shadow-2 border-round mt-4">        <!-- Session Header -->        <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">          <div>            <h1 class="text-2xl font-semibold m-0">{{session.title}}</h1>            <div class="flex align-items-center mt-2">              <p-tag                 [value]="getStatusLabel(session.status)"                [severity]="getStatusSeverity(session.status)"                [rounded]="true"                class="mr-2"              ></p-tag>              <span class="text-500">Version {{session.session_version}}</span>            </div>          </div>                    <div class="mt-3 md:mt-0">            <button               *ngIf="isReviewer && !hasReviewed"              pButton               label="Submit Review"               icon="pi pi-check-circle"              class="p-button-success p-button-rounded mr-2"              (click)="showReviewDialog = true"            ></button>                        <button               *ngIf="canMakeFinalDecision()"              pButton               label="Make Final Decision"               icon="pi pi-check-square"              class="p-button-primary p-button-rounded"              (click)="showDecisionDialog = true"            ></button>          </div>        </div>
        
        <!-- Session Info -->
        <p-tabView>
          <!-- Session Details Tab -->
          <p-tabPanel header="Session Details">
            <div class="grid">
              <div class="col-12 md:col-4">
                <!-- Basic Info Section -->
                <div class="surface-card p-4 border-round mb-4 shadow-1">
                  <h3 class="text-lg font-semibold mt-0 mb-3">Basic Info</h3>
                  
                  <div class="grid">
                    <div class="col-5 text-500">Submitter</div>
                    <div class="col-7 text-900">
                      {{session.basic_info?.submitter_name}}
                      <div *ngIf="session.basic_info?.submitter_job" class="text-600 text-sm">
                        {{session.basic_info?.submitter_job}}
                      </div>
                    </div>
                    
                    <div class="col-5 text-500">Manager</div>
                    <div class="col-7 text-900">{{session.basic_info?.manager || 'N/A'}}</div>
                    
                    <div class="col-5 text-500">Stream</div>
                    <div class="col-7 text-900">{{session.basic_info?.stream || 'N/A'}}</div>
                    
                    <div class="col-5 text-500">Clients</div>
                    <div class="col-7 text-900">{{session.basic_info?.clients || 'N/A'}}</div>
                    
                    <div class="col-5 text-500">Created at</div>
                    <div class="col-7 text-900">{{session.created_at | date:'medium'}}</div>
                    
                    <div class="col-5 text-500">Reviews</div>
                    <div class="col-7 text-900">
                      <div class="flex align-items-center">
                        <span class="mr-2">{{session.review_count}}/{{session.min_required_reviews}}</span>
                        <p-progressBar 
                          [value]="(session.review_count / session.min_required_reviews) * 100" 
                          [showValue]="false"
                          [style]="{'height': '0.5rem', 'width': '100px'}"
                        ></p-progressBar>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-12 md:col-8">
                <div class="mb-4">
                  <div class="text-900 font-medium mb-2">Problem Statements</div>
                  <div class="p-3 border-1 border-round surface-ground">
                    <p class="white-space-pre-line m-0">{{session.problem_statements}}</p>
                  </div>
                </div>
                
                <div class="mb-4">
                  <div class="text-900 font-medium mb-2">Solutions</div>
                  <div class="p-3 border-1 border-round surface-ground">
                    <p class="white-space-pre-line m-0">{{session.solutions}}</p>
                  </div>
                </div>
                
                <div class="mb-4">
                  <div class="text-900 font-medium mb-2">Value Proposition</div>
                  <div class="p-3 border-1 border-round surface-ground">
                    <p class="white-space-pre-line m-0">{{session.value}}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Final Decision Section (if has final decision) -->
            <div *ngIf="session.has_final_decision" class="mt-4 p-3 border-1 border-round" 
                [ngClass]="{
                  'surface-success text-success-900': session.final_decision === 'APPROVED',
                  'surface-danger text-danger-900': session.final_decision === 'REJECTED',
                  'surface-warning text-warning-900': session.final_decision === 'NEED_IMPROVEMENT'
                }">
              <h3 class="mt-0 mb-2">
                Final Decision: {{getStatusLabel(session.final_decision || '')}}
              </h3>
              <p class="m-0 white-space-pre-line">{{session.final_comments}}</p>
              <div class="mt-2 text-600">
                Decision by {{session.final_reviewer_name}} on {{session.updated_at | date:'medium'}}
              </div>
            </div>
          </p-tabPanel>
          
                              <!-- Reviews Tab -->          <p-tabPanel header="Reviews ({{reviews.length}})">            <div *ngIf="reviewsLoading" class="flex justify-content-center py-4">              <i class="pi pi-spin pi-spinner text-xl"></i>            </div>                        <div *ngIf="!reviewsLoading && reviews.length === 0" class="text-center p-4">              <i class="pi pi-comment text-4xl text-500 mb-3"></i>              <p class="text-700">No reviews yet</p>                            <button                 *ngIf="isReviewer && !hasReviewed && session.status === 'IN_REVIEW'"                pButton                 label="Add Review"                 icon="pi pi-plus-circle"                class="p-button-outlined p-button-rounded mt-3"                (click)="showReviewDialog = true"              ></button>            </div>                        <div *ngIf="!reviewsLoading && reviews.length > 0" class="mb-4 text-center">              <button                 *ngIf="isReviewer && !hasReviewed && session.status === 'IN_REVIEW'"                pButton                 label="Add Review"                 icon="pi pi-plus-circle"                class="p-button-outlined p-button-rounded mb-3"                (click)="showReviewDialog = true"              ></button>            </div>                        <p-accordion *ngIf="!reviewsLoading && reviews.length > 0">              <p-accordionTab *ngFor="let review of reviews" [header]="review.reviewer_name + ' - ' + (review.created_at | date:'short')">
                <div class="grid">
                  <div class="col-12 md:col-6 mb-3">
                    <div class="flex align-items-center mb-2">
                      <span class="text-900 font-medium mr-3">Innovation:</span>
                      <p-rating [ngModel]="review.innovation_score" [readonly]="true" [cancel]="false"></p-rating>
                      <span class="ml-2">{{review.innovation_score}}/5</span>
                    </div>
                    <p *ngIf="review.innovation_comments" class="m-0 text-600">
                      {{review.innovation_comments}}
                    </p>
                  </div>
                  
                  <div class="col-12 md:col-6 mb-3">
                    <div class="flex align-items-center mb-2">
                      <span class="text-900 font-medium mr-3">Value:</span>
                      <p-rating [ngModel]="review.value_score" [readonly]="true" [cancel]="false"></p-rating>
                      <span class="ml-2">{{review.value_score}}/5</span>
                    </div>
                    <p *ngIf="review.value_comments" class="m-0 text-600">
                      {{review.value_comments}}
                    </p>
                  </div>
                  
                  <div class="col-12 md:col-6 mb-3">
                    <div class="flex align-items-center mb-2">
                      <span class="text-900 font-medium mr-3">Feasibility:</span>
                      <p-rating [ngModel]="review.feasibility_score" [readonly]="true" [cancel]="false"></p-rating>
                      <span class="ml-2">{{review.feasibility_score}}/5</span>
                    </div>
                    <p *ngIf="review.feasibility_comments" class="m-0 text-600">
                      {{review.feasibility_comments}}
                    </p>
                  </div>
                  
                  <div class="col-12 md:col-6 mb-3">
                    <div class="flex align-items-center mb-2">
                      <span class="text-900 font-medium mr-3">Impact:</span>
                      <p-rating [ngModel]="review.impact_score" [readonly]="true" [cancel]="false"></p-rating>
                      <span class="ml-2">{{review.impact_score}}/5</span>
                    </div>
                    <p *ngIf="review.impact_comments" class="m-0 text-600">
                      {{review.impact_comments}}
                    </p>
                  </div>
                  
                  <div class="col-12 md:col-6 mb-3">
                    <div class="flex align-items-center mb-2">
                      <span class="text-900 font-medium mr-3">ROI:</span>
                      <p-rating [ngModel]="review.roi_score" [readonly]="true" [cancel]="false"></p-rating>
                      <span class="ml-2">{{review.roi_score}}/5</span>
                    </div>
                    <p *ngIf="review.roi_comments" class="m-0 text-600">
                      {{review.roi_comments}}
                    </p>
                  </div>
                </div>
              </p-accordionTab>
            </p-accordion>
          </p-tabPanel>
          
          <!-- Original Idea Tab -->
          <p-tabPanel header="Original Idea">
            <div *ngIf="ideaLoading" class="flex justify-content-center py-4">
              <i class="pi pi-spin pi-spinner text-xl"></i>
            </div>
            
            <div *ngIf="!ideaLoading && idea" class="p-2">
              <h2 class="text-xl font-semibold mb-3">{{idea.title}}</h2>
              
              <div class="mb-3">
                <div class="text-900 font-medium mb-1">Description</div>
                <div class="p-2 border-1 border-round surface-ground">
                  <p class="white-space-pre-line m-0">{{idea.description}}</p>
                </div>
              </div>
              
              <div class="mb-3">
                <div class="text-900 font-medium mb-1">Tags</div>
                <div class="flex flex-wrap">
                  <p-tag *ngFor="let tag of idea.tag_details" 
                        [value]="tag?.tag_name || ''"
                        [rounded]="true"
                        class="mr-2 mb-1">
                  </p-tag>
                </div>
              </div>
              
              <div class="mb-3">
                <div class="text-900 font-medium mb-1">Created by</div>
                <div>{{idea.creator_name}} on {{idea.created_at | date:'medium'}}</div>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>
      
                        <!-- Review Dialog -->      <p-dialog         [(visible)]="showReviewDialog"         [style]="{width: '90%', maxWidth: '800px'}"         [modal]="true"        [closeOnEscape]="false"        [closable]="!submitting"        header="Submit Review">        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">          <div class="grid">                        <!-- Innovation -->            <div class="col-12 mb-3">              <label class="block text-900 font-medium mb-2">Innovation</label>              <div class="flex align-items-center mb-2">                <p-rating formControlName="innovation_score" [cancel]="false"></p-rating>                <span class="ml-2">{{reviewForm.get('innovation_score')?.value || 0}}/5</span>              </div>              <textarea                 pInputTextarea                 formControlName="innovation_comments"                [rows]="2"                 [autoResize]="true"                placeholder="Add comments (optional)"                class="w-full"              ></textarea>            </div>                        <!-- Value -->            <div class="col-12 mb-3">              <label class="block text-900 font-medium mb-2">Value</label>              <div class="flex align-items-center mb-2">                <p-rating formControlName="value_score" [cancel]="false"></p-rating>                <span class="ml-2">{{reviewForm.get('value_score')?.value || 0}}/5</span>              </div>              <textarea                 pInputTextarea                 formControlName="value_comments"                [rows]="2"                 [autoResize]="true"                placeholder="Add comments (optional)"                class="w-full"              ></textarea>            </div>                        <!-- Feasibility -->            <div class="col-12 mb-3">              <label class="block text-900 font-medium mb-2">Feasibility</label>              <div class="flex align-items-center mb-2">                <p-rating formControlName="feasibility_score" [cancel]="false"></p-rating>                <span class="ml-2">{{reviewForm.get('feasibility_score')?.value || 0}}/5</span>              </div>              <textarea                 pInputTextarea                 formControlName="feasibility_comments"                [rows]="2"                 [autoResize]="true"                placeholder="Add comments (optional)"                class="w-full"              ></textarea>            </div>                        <!-- Impact -->            <div class="col-12 mb-3">              <label class="block text-900 font-medium mb-2">Impact</label>              <div class="flex align-items-center mb-2">                <p-rating formControlName="impact_score" [cancel]="false"></p-rating>                <span class="ml-2">{{reviewForm.get('impact_score')?.value || 0}}/5</span>              </div>              <textarea                 pInputTextarea                 formControlName="impact_comments"                [rows]="2"                 [autoResize]="true"                placeholder="Add comments (optional)"                class="w-full"              ></textarea>            </div>                        <!-- ROI -->            <div class="col-12 mb-3">              <label class="block text-900 font-medium mb-2">Return on Investment</label>              <div class="flex align-items-center mb-2">                <p-rating formControlName="roi_score" [cancel]="false"></p-rating>                <span class="ml-2">{{reviewForm.get('roi_score')?.value || 0}}/5</span>              </div>              <textarea                 pInputTextarea                 formControlName="roi_comments"                [rows]="2"                 [autoResize]="true"                placeholder="Add comments (optional)"                class="w-full"              ></textarea>            </div>          </div>                              <div class="flex justify-content-end gap-2 mt-4">            <button               type="button"               pButton               label="Cancel"               class="p-button-outlined p-button-rounded"              [disabled]="submitting"              (click)="showReviewDialog = false"            ></button>            <button               type="submit"               pButton               label="Submit Review"               class="p-button-success p-button-rounded"              [disabled]="reviewForm.invalid || submitting"              [loading]="submitting"            ></button>          </div>
        </form>
      </p-dialog>
      
                  <!-- Final Decision Dialog -->      <p-dialog         [(visible)]="showDecisionDialog"         [style]="{width: '90%', maxWidth: '600px'}"         [modal]="true"        [closeOnEscape]="false"        [closable]="!submitting"        header="Make Final Decision">        <form [formGroup]="decisionForm" (ngSubmit)="submitFinalDecision()">                    <div class="field mb-4">            <label class="block text-900 font-medium mb-2">Decision</label>            <div class="p-field-radiobutton">              <p-radioButton formControlName="decision" value="APPROVED" inputId="approved"></p-radioButton>              <label for="approved" class="ml-2">Approve</label>            </div>            <div class="p-field-radiobutton mt-2">              <p-radioButton formControlName="decision" value="REJECTED" inputId="rejected"></p-radioButton>              <label for="rejected" class="ml-2">Reject</label>            </div>            <div class="p-field-radiobutton mt-2">              <p-radioButton formControlName="decision" value="NEED_IMPROVEMENT" inputId="need_improvement"></p-radioButton>              <label for="need_improvement" class="ml-2">Needs Improvement</label>            </div>          </div>                    <div class="field mb-4" *ngIf="decisionForm.get('decision')?.value !== 'APPROVED'">            <label class="block text-900 font-medium mb-2">Allow Resubmission?</label>            <div class="p-field-checkbox">              <p-checkbox formControlName="allow_resubmit" [binary]="true" inputId="allow_resubmit"></p-checkbox>              <label for="allow_resubmit" class="ml-2">Yes, allow creator to resubmit</label>            </div>          </div>                    <div class="field mb-4">            <label class="block text-900 font-medium mb-2">Comments</label>            <textarea               pInputTextarea               formControlName="comments"              [rows]="5"               [autoResize]="true"              placeholder="Provide feedback for this session"              class="w-full"            ></textarea>
            <small 
              *ngIf="decisionForm.get('comments')?.invalid && decisionForm.get('comments')?.touched"
              class="p-error"
            >
              Comments are required
            </small>
          </div>
          
          <div class="flex justify-content-end gap-2 mt-4">
            <button 
              type="button" 
              pButton 
              label="Cancel" 
              class="p-button-outlined p-button-rounded"
              [disabled]="submitting"
              (click)="showDecisionDialog = false"
            ></button>
            <button 
              type="submit" 
              pButton 
              label="Submit Decision" 
              class="p-button-primary p-button-rounded"
              [disabled]="decisionForm.invalid || submitting"
              [loading]="submitting"
            ></button>
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-tabview-panels {
        padding: 1.25rem 0;
      }
      
      .p-rating .p-rating-item.p-rating-item-active .p-rating-icon {
        color: var(--yellow-500);
      }
      
      .surface-success {
        background-color: var(--green-50);
      }
      
      .surface-danger {
        background-color: var(--red-50);
      }
      
      .surface-warning {
        background-color: var(--yellow-50);
      }
      
      .text-success-900 {
        color: var(--green-900);
      }
      
      .text-danger-900 {
        color: var(--red-900);
      }
      
      .text-warning-900 {
        color: var(--yellow-900);
      }
    }
  `]
})
export class SessionDetailComponent implements OnInit {
  session: IdeaSession | null = null;
  idea: Idea | null = null;
  reviews: SessionReview[] = [];
  
  loading: boolean = true;
  ideaLoading: boolean = false;
  reviewsLoading: boolean = false;
  submitting: boolean = false;
  
  showReviewDialog: boolean = false;
  showDecisionDialog: boolean = false;
  
  reviewForm: FormGroup;
  decisionForm: FormGroup;
  
  hasReviewed: boolean = false;
  isReviewer: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private ideaService: IdeaService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
        this.reviewForm = this.fb.group({      innovation_score: [null, [Validators.required, Validators.min(1), Validators.max(5)]],      innovation_comments: [''],      value_score: [null, [Validators.required, Validators.min(1), Validators.max(5)]],      value_comments: [''],      feasibility_score: [null, [Validators.required, Validators.min(1), Validators.max(5)]],      feasibility_comments: [''],      impact_score: [null, [Validators.required, Validators.min(1), Validators.max(5)]],      impact_comments: [''],      roi_score: [null, [Validators.required, Validators.min(1), Validators.max(5)]],      roi_comments: ['']    });
    
    this.decisionForm = this.fb.group({
      decision: ['APPROVED', Validators.required],
      comments: ['', Validators.required],
      allow_resubmit: [true]
    });
  }
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const sessionId = params.get('id');
      if (sessionId) {
        this.loadSessionDetails(sessionId);
      } else {
        this.toastService.showError('Session ID is missing');
        this.router.navigate(['/sessions']);
      }
    });
    
    // Check if user has reviewer role
    this.checkReviewerRole();
  }
  
  loadSessionDetails(sessionId: string): void {
    this.loading = true;
    
    this.sessionService.getSessionById(sessionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.session = response.data;
          this.loadReviews(sessionId);
          this.loadIdeaDetails(this.session.idea_id);
        } else {
          this.toastService.showError('Failed to load session details');
          this.router.navigate(['/sessions']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading session', error);
        this.toastService.showError('Failed to load session details');
        this.router.navigate(['/sessions']);
        this.loading = false;
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
          
          // Check if current user has already submitted a review
          this.checkIfUserHasReviewed();
        }
      },
      error: (error) => {
        this.reviewsLoading = false;
        console.error('Error loading reviews', error);
      }
    });
  }
  
  loadIdeaDetails(ideaId: string): void {
    this.ideaLoading = true;
    
    this.ideaService.getIdeaById(ideaId).subscribe({
      next: (response) => {
        this.ideaLoading = false;
        if (response.success && response.data) {
          this.idea = response.data;
        }
      },
      error: (error) => {
        this.ideaLoading = false;
        console.error('Error loading idea details', error);
      }
    });
  }
  
  checkReviewerRole(): void {
    // This should be implemented based on the specific permission system
    // For now, assume all logged-in users have reviewer permissions
    this.isReviewer = this.authService.isLoggedIn();
  }
  
  checkIfUserHasReviewed(): void {
    if (!this.authService.isLoggedIn()) {
      this.hasReviewed = false;
      return;
    }
    
    const currentUserId = this.authService.getId();
    this.hasReviewed = this.reviews.some(review => review.reviewer_id === currentUserId);
  }
  
  canReview(): boolean {
    if (!this.session || !this.isReviewer || !this.authService.isLoggedIn()) {
      return false;
    }
    
    // Users who have already submitted a review cannot review again
    if (this.hasReviewed) {
      return false;
    }
    
    // Only sessions with IN_REVIEW status can be reviewed
    return this.session.status === SessionStatus.IN_REVIEW;
  }
  
  canMakeFinalDecision(): boolean {
    if (!this.session || !this.isReviewer || !this.authService.isLoggedIn()) {
      return false;
    }
    
    // Cannot make a decision if a final decision has already been made
    if (this.session.has_final_decision) {
      return false;
    }
    
    // Only sessions with IN_REVIEW status can have decisions made
    if (this.session.status !== SessionStatus.IN_REVIEW) {
      return false;
    }
    
    // The number of reviews must meet the minimum requirement
    return this.session.review_count >= this.session.min_required_reviews;
  }
  
  submitReview(): void {
    if (this.reviewForm.invalid) {
      Object.keys(this.reviewForm.controls).forEach(key => {
        const control = this.reviewForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    if (!this.session) {
      this.toastService.showError('Session data is missing');
      return;
    }
    
    this.submitting = true;
    const formValue = this.reviewForm.value;
    
    // Build review data according to backend model
    const reviewData = {
      session_id: this.session.id,
      reviewer_id: this.authService.getId(),
      reviewer_name: this.authService.getUserName(),
      innovation_score: formValue.innovation_score,
      innovation_comments: formValue.innovation_comments,
      value_score: formValue.value_score,
      value_comments: formValue.value_comments,
      feasibility_score: formValue.feasibility_score,
      feasibility_comments: formValue.feasibility_comments,
      impact_score: formValue.impact_score,
      impact_comments: formValue.impact_comments,
      roi_score: formValue.roi_score,
      roi_comments: formValue.roi_comments,
    };
    
    this.sessionService.submitReview(this.session.id, reviewData).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.toastService.showSuccess('Review submitted successfully');
          this.showReviewDialog = false;
          this.hasReviewed = true;
          
          // Reload session and reviews
          this.loadSessionDetails(this.session!.id);
        } else {
          this.toastService.showError('Failed to submit review');
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error submitting review', error);
        this.toastService.showError('Failed to submit review');
      }
    });
  }
  
  submitFinalDecision(): void {
    if (this.decisionForm.invalid) {
      Object.keys(this.decisionForm.controls).forEach(key => {
        const control = this.decisionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    if (!this.session) {
      this.toastService.showError('Session data is missing');
      return;
    }
    
    this.submitting = true;
    const formValue = this.decisionForm.value;
    
    // If decision is APPROVED, always set allow_resubmit to false
    if (formValue.decision === 'APPROVED') {
      formValue.allow_resubmit = false;
    }
    
    // Build decision data according to backend model
    const decisionData = {
      session_id: this.session.id,
      reviewer_id: this.authService.getId(),
      decision: formValue.decision,
      comments: formValue.comments,
      allow_resubmit: formValue.allow_resubmit
    };
    
    this.sessionService.submitFinalDecision(this.session.id, decisionData).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.toastService.showSuccess('Final decision submitted successfully');
          this.showDecisionDialog = false;
          
          // Reload session
          this.loadSessionDetails(this.session!.id);
        } else {
          this.toastService.showError('Failed to submit final decision');
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error submitting final decision', error);
        this.toastService.showError('Failed to submit final decision');
      }
    });
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case SessionStatus.PENDING:
        return 'Pending';
      case SessionStatus.IN_REVIEW:
        return 'In Review';
      case SessionStatus.APPROVED:
        return 'Approved';
      case SessionStatus.REJECTED:
        return 'Rejected';
      case SessionStatus.NEED_IMPROVEMENT:
        return 'Need Improvement';
      case SessionStatus.RESUBMITTED:
        return 'Resubmitted';
      default:
        return status;
    }
  }
  
  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case SessionStatus.PENDING:
        return 'info';
      case SessionStatus.IN_REVIEW:
        return 'warning';
      case SessionStatus.APPROVED:
        return 'success';
      case SessionStatus.REJECTED:
        return 'danger';
      case SessionStatus.NEED_IMPROVEMENT:
        return 'warning';
      case SessionStatus.RESUBMITTED:
        return 'info';
      default:
        return 'info';
    }
  }
} 