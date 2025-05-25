import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IdeaService } from '../../services/idea.service';
import { Idea, ReviewStatus, IdeaStatus } from '../../models/idea.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-idea-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule
  ],
  templateUrl: './idea-session.component.html',
  styleUrls: ['./idea-session.component.scss']
})
export class IdeaSessionComponent implements OnInit {
  ideas: Idea[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  isLoading = true;
  searchQuery = '';

  constructor(
    private ideaService: IdeaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSessionIdeas();
  }

  loadSessionIdeas(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    
    const params = {
      skip: (page - 1) * this.pageSize,
      limit: this.pageSize,
      search: this.searchQuery || undefined,
      sort_by: 'created_at',
      sort_order: 'desc' as 'asc' | 'desc'
    };
    
    this.ideaService.getSessionIdeas(params)
      .subscribe({
        next: (response: ApiResponse<Idea[]>) => {
          if (response.success) {
            this.ideas = response.data || [];
            this.totalItems = response.pagination?.total || 0;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading session ideas:', error);
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: any): void {
    const page = Math.floor(event.first / event.rows) + 1;
    this.loadSessionIdeas(page);
  }

  onSearch(): void {
    this.loadSessionIdeas(1);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadSessionIdeas(1);
  }

  getReviewStatusSeverity(status: ReviewStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (status) {
      case ReviewStatus.APPROVED:
        return 'success';
      case ReviewStatus.REJECTED:
        return 'danger';
      case ReviewStatus.IN_REVIEW:
        return 'info';
      default:
        return 'secondary';
    }
  }

  getReviewStatusLabel(status: ReviewStatus): string {
    switch (status) {
      case ReviewStatus.APPROVED:
        return 'Approved';
      case ReviewStatus.REJECTED:
        return 'Rejected';
      case ReviewStatus.IN_REVIEW:
        return 'In Review';
      case ReviewStatus.NEED_IMPROVEMENT:
        return 'Need Improvement';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get idea status severity based on overall idea status
   */
  getIdeaStatusSeverity(idea: Idea): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    // Check if the idea has session_review, if not it's probably a different status
    if (!idea.session_review) {
      return 'secondary';
    }
    
    return this.getReviewStatusSeverity(idea.session_review.status);
  }

  /**
   * Get idea status label based on overall idea status
   */
  getIdeaStatusLabel(idea: Idea): string {
    if (!idea.session_review) {
      return 'No Session Review';
    }
    
    return this.getReviewStatusLabel(idea.session_review.status);
  }

  /**
   * Get score severity based on average score value
   */
  getScoreSeverity(score: number): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (score >= 4.0) {
      return 'success';
    } else if (score >= 3.0) {
      return 'info';
    } else if (score >= 2.0) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  viewIdea(id: string): void {
    this.router.navigate(['/idea-session', id]);
  }

  /**
   * Check if current user can edit the idea session review
   */
  canEditSessionReview(idea: Idea): boolean {
    // Can edit if:
    // 1. User is the idea creator
    // 2. Session review status is NEED_IMPROVEMENT
    const isCreator = idea.creator_id === this.authService.getId();
    const isNeedImprovement = idea.session_review?.status === ReviewStatus.NEED_IMPROVEMENT;
    
    return isCreator && isNeedImprovement;
  }

  /**
   * Navigate to session review form for editing
   */
  editSessionReview(idea: Idea): void {
    this.router.navigate(['/session-review', idea.id]);
  }
} 