import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { Idea, IdeaStatus, ReviewStatus } from '../../models/idea.model';
import { Review, REVIEW_CRITERIA } from '../../models/review.model';
import { IdeaService } from '../../services/idea.service';
import { ReviewService } from '../../services/review.service';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { ReviewListComponent } from '../review-list/review-list.component';
import { FinalDecisionComponent } from '../final-decision/final-decision.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-idea-incubator-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    TabViewModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule,
    DialogModule,
    BreadcrumbModule,
    ReviewFormComponent,
    ReviewListComponent,
    FinalDecisionComponent
  ],
  templateUrl: './idea-incubator-details.component.html',
  styleUrls: ['./idea-incubator-details.component.scss']
})
export class IdeaIncubatorDetailsComponent implements OnInit {
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
    this.reviewService.getReviews(ideaId, 'Incubator').subscribe({
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
   * Check if current user has IDEA_INCUBATOR_REVIEWER role
   */
  hasIncubatorReviewerRole(): boolean {
    return this.userRoles.includes('IDEA_INCUBATOR_REVIEWER');
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
      case IdeaStatus.IN_INCUBATOR_REVIEW:
        return 'In Incubator Review';
      case IdeaStatus.INCUBATOR_APPROVED:
        return 'Incubator Approved';
      case IdeaStatus.INCUBATOR_REJECTED:
        return 'Incubator Rejected';
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
      case IdeaStatus.INCUBATOR_APPROVED:
      case IdeaStatus.ROLL_OUT:
        return 'success';
      case IdeaStatus.SESSION_REJECTED:
      case IdeaStatus.INCUBATOR_REJECTED:
        return 'danger';
      case IdeaStatus.IN_INCUBATOR_REVIEW:
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
    return (this.reviewCriteria as any)[criteria]?.title || criteria;
  }

  getCriteriaDescription(criteria: string): string {
    return (this.reviewCriteria as any)[criteria]?.description || '';
  }

  getScoreLabel(criteria: string, score: number): string {
    const criteriaData = (this.reviewCriteria as any)[criteria];
    if (criteriaData && criteriaData.scoreLabels) {
      return criteriaData.scoreLabels[score] || score.toString();
    }
    return score.toString();
  }

  goBack(): void {
    this.router.navigate(['/idea-incubator']);
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentUserName(): string {
    return this.authService.getUserName() || 'Unknown User';
  }

  onReviewsUpdated(): void {
    if (this.idea) {
      // Reload the idea details to get updated review summary
      this.loadIdeaDetails();
      
      // Also reload just the reviews
      this.loadReviews(this.idea.id);
    }
  }

  // Review form dialog management
  showAddReviewDialog = false;

  canAddReview(): boolean {
    if (!this.idea || !this.hasIncubatorReviewerRole()) {
      return false;
    }

    // Check if idea is in incubator review status
    return this.idea.status === IdeaStatus.IN_INCUBATOR_REVIEW;
  }

  getAddReviewTooltip(): string {
    if (!this.hasIncubatorReviewerRole()) {
      return 'You need IDEA_INCUBATOR_REVIEWER role to add reviews';
    }
    
    if (!this.idea) {
      return 'No idea loaded';
    }
    
    if (this.idea.status !== IdeaStatus.IN_INCUBATOR_REVIEW) {
      return 'Idea must be in incubator review status to add reviews';
    }
    
    return 'Add a new incubator review for this idea';
  }

  openAddReviewForm(): void {
    this.showAddReviewDialog = true;
  }

  closeAddReviewDialog(): void {
    this.showAddReviewDialog = false;
  }

  canMakeFinalDecision(): boolean {
    if (!this.idea || !this.hasIncubatorReviewerRole()) {
      return false;
    }
    
    // Can make final decision if idea is in incubator review status
    return this.idea.status === IdeaStatus.IN_INCUBATOR_REVIEW;
  }

  getFinalDecisionTooltip(): string {
    if (!this.idea) {
      return 'Idea not loaded';
    }
    
    if (!this.hasIncubatorReviewerRole()) {
      return 'You need IDEA_INCUBATOR_REVIEWER role to make final decisions';
    }
    
    if (this.idea.status !== IdeaStatus.IN_INCUBATOR_REVIEW) {
      return 'Idea must be in incubator review status';
    }
    
    const reviewCount = this.idea.incubator_review?.review_count || 0;
    return `Make final decision based on ${reviewCount} reviews`;
  }

  onFinalDecisionSubmitted(updatedIdea: Idea): void {
    this.idea = updatedIdea;
    this.showFinalDecisionDialog = false;
    this.onReviewsUpdated();
  }

  onFinalDecisionCancelled(): void {
    this.showFinalDecisionDialog = false;
  }

  private updateBreadcrumb(): void {
    if (this.idea) {
      this.breadcrumbItems = [
        { label: 'Idea Incubator', routerLink: '/idea-incubator' },
        { label: this.idea.title }
      ];
    }
  }
} 