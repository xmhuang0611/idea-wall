import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RatingModule } from 'primeng/rating';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { Idea, IdeaStatus, ReviewStatus } from '../../models/idea.model';
import { Review, REVIEW_CRITERIA } from '../../models/review.model';
import { IdeaService } from '../../services/idea.service';
import { ReviewService } from '../../services/review.service';
import { FeelingUtilService } from '../../shared/services/feeling-util.service';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { ReviewListComponent } from '../review-list/review-list.component';
import { FinalDecisionComponent } from '../final-decision/final-decision.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-idea-session-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    TabViewModule,
    DividerModule,
    ProgressSpinnerModule,
    RatingModule,
    TooltipModule,
    DialogModule,
    BreadcrumbModule,
    ReviewFormComponent,
    ReviewListComponent,
    FinalDecisionComponent
  ],
  templateUrl: './idea-session-details.component.html',
  styleUrls: ['./idea-session-details.component.scss']
})
export class IdeaSessionDetailsComponent implements OnInit {
  idea: Idea | null = null;
  reviews: Review[] = [];
  isLoading = false;
  reviewCriteria = REVIEW_CRITERIA;
  showFinalDecisionDialog = false;
  userRoles: string[] = [];

  // Breadcrumb items
  breadcrumbItems: MenuItem[] = [];
  homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ideaService: IdeaService,
    private reviewService: ReviewService,
    public feelingUtil: FeelingUtilService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadIdeaDetails();
    this.loadUserRoles();
  }

  private loadIdeaDetails(): void {
    this.route.params.subscribe(params => {
      const ideaId = params['id'];
      if (ideaId) {
        this.isLoading = true;
        
        // Load idea details
        this.ideaService.getIdeaById(ideaId).subscribe({
          next: (response: any) => {
            if (response.success && response.data) {
              this.idea = response.data;
              this.updateBreadcrumb();
              this.loadReviews(ideaId);
            } else {
              this.isLoading = false;
            }
          },
          error: (error: any) => {
            console.error('Error loading idea details:', error);
            this.isLoading = false;
          }
        });
      }
    });
  }

  private loadReviews(ideaId: string): void {
    this.reviewService.getReviews(ideaId, 'Session').subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.reviews = response.data;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading reviews:', error);
        this.isLoading = false;
      }
    });
  }

  private loadUserRoles(): void {
    this.authService.getUserRoles().subscribe({
      next: (roles: string[]) => {
        this.userRoles = roles;
      },
      error: (error: any) => {
        console.error('Error loading user roles:', error);
        this.userRoles = [];
      }
    });
  }

  /**
   * Check if current user has IDEA_SESSION_PANEL_REVIEWER role
   */
  hasSessionPanelReviewerRole(): boolean {
    return this.userRoles.includes('IDEA_SESSION_PANEL_REVIEWER');
  }

  getIdeaStatusLabel(status?: IdeaStatus): string {
    switch (status) {
      case IdeaStatus.DRAFT:
        return 'Draft';
      case IdeaStatus.IN_SESSION_REVIEW:
        return 'In Session Review';
      case IdeaStatus.SESSION_APPROVED:
        return 'Session Approved';
      case IdeaStatus.SESSION_REJECTED:
        return 'Session Rejected';
      case IdeaStatus.IN_INCUBATION_REVIEW:
        return 'In Incubation Review';
      case IdeaStatus.INCUBATION_APPROVED:
        return 'Incubation Approved';
      case IdeaStatus.INCUBATION_REJECTED:
        return 'Incubation Rejected';
      case IdeaStatus.ROLL_OUT:
        return 'Roll Out';
      default:
        return 'Unknown';
    }
  }

  getIdeaStatusSeverity(status?: IdeaStatus): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status) {
      case IdeaStatus.DRAFT:
        return 'secondary';
      case IdeaStatus.IN_SESSION_REVIEW:
        return 'info';
      case IdeaStatus.SESSION_APPROVED:
      case IdeaStatus.INCUBATION_APPROVED:
      case IdeaStatus.ROLL_OUT:
        return 'success';
      case IdeaStatus.SESSION_REJECTED:
      case IdeaStatus.INCUBATION_REJECTED:
        return 'danger';
      case IdeaStatus.IN_INCUBATION_REVIEW:
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getReviewStatusLabel(status?: ReviewStatus): string {
    switch (status) {
      case ReviewStatus.IN_REVIEW:
        return 'In Review';
      case ReviewStatus.APPROVED:
        return 'Approved';
      case ReviewStatus.REJECTED:
        return 'Rejected';
      case ReviewStatus.NEED_IMPROVEMENT:
        return 'Need Improvement';
      default:
        return 'Unknown';
    }
  }

  getReviewStatusSeverity(status?: ReviewStatus): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status) {
      case ReviewStatus.IN_REVIEW:
        return 'info';
      case ReviewStatus.APPROVED:
        return 'success';
      case ReviewStatus.REJECTED:
        return 'danger';
      case ReviewStatus.NEED_IMPROVEMENT:
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getCriteriaTitle(criteria: string): string {
    return this.reviewCriteria[criteria as keyof typeof this.reviewCriteria]?.title || criteria;
  }

  getCriteriaDescription(criteria: string): string {
    return this.reviewCriteria[criteria as keyof typeof this.reviewCriteria]?.description || '';
  }

  getScoreLabel(criteria: string, score: number): string {
    const criteriaData = this.reviewCriteria[criteria as keyof typeof this.reviewCriteria];
    if (criteriaData) {
      const level = criteriaData.levels.find(l => l.value === score);
      return level ? level.label : `Score ${score}`;
    }
    return `Score ${score}`;
  }

  goBack(): void {
    this.router.navigate(['/idea-session']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentUserName(): string {
    // Get current user name from authentication service
    return this.authService.getUserName() || 'Current User';
  }

  onReviewsUpdated(): void {
    // Reload reviews after any review operation
    if (this.idea) {
      this.loadReviews(this.idea.id);
      // Also reload idea to get updated average score
      this.ideaService.getIdeaById(this.idea.id).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.idea = response.data;
          }
        },
        error: (error: any) => {
          console.error('Error reloading idea details:', error);
        }
      });
    }
  }

  canAddReview(): boolean {
    if (!this.authService.getId()) {
      return false;
    }
    
    const currentUserId = this.authService.getId();
    const hasExistingReview = this.reviews.some(review => review.creator_id === currentUserId);
    const isInSessionReview = this.idea?.status === IdeaStatus.IN_SESSION_REVIEW;
    
    return !hasExistingReview && isInSessionReview;
  }

  getAddReviewTooltip(): string {
    if (!this.authService.getId()) {
      return 'You must be logged in to add a review';
    }
    
    if (this.idea?.status !== IdeaStatus.IN_SESSION_REVIEW) {
      return 'Reviews can only be added when idea is in session review status';
    }
    
    const currentUserId = this.authService.getId();
    const hasExistingReview = this.reviews.some(review => review.creator_id === currentUserId);
    
    if (hasExistingReview) {
      return 'You have already submitted a review';
    }
    
    return 'Add your review for this idea';
  }

  showAddReviewDialog = false;

  openAddReviewForm(): void {
    this.showAddReviewDialog = true;
  }

  closeAddReviewDialog(): void {
    this.showAddReviewDialog = false;
  }

  canMakeFinalDecision(): boolean {
    // Can make final decision if there are at least 2 reviews AND idea is in session review status
    return this.reviews.length >= 2 && 
           this.idea?.status === IdeaStatus.IN_SESSION_REVIEW;
  }

  getFinalDecisionTooltip(): string {
    if (this.idea?.status !== IdeaStatus.IN_SESSION_REVIEW) {
      return 'Idea must be in session review status to make final decision';
    }
    if (this.reviews.length < 2) {
      return 'At least 2 reviews required for final decision';
    }
    return `Make final decision based on ${this.reviews.length} reviews`;
  }

  onFinalDecisionSubmitted(updatedIdea: Idea): void {
    // Update the idea with the final decision
    this.idea = updatedIdea;
    this.showFinalDecisionDialog = false;
  }

  onFinalDecisionCancelled(): void {
    // Close the dialog
    this.showFinalDecisionDialog = false;
  }

  private updateBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Idea Session', routerLink: '/idea-session' },
      { label: this.idea?.title || 'Idea Details' }
    ];
  }
} 