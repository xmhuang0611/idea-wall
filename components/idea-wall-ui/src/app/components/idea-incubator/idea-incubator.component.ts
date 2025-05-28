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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { IdeaService } from '../../services/idea.service';
import { Idea, ReviewStatus, IdeaStatus } from '../../models/idea.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-idea-incubator',
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
    DialogModule,
    BreadcrumbModule
  ],
  templateUrl: './idea-incubator.component.html',
  styleUrls: ['./idea-incubator.component.scss']
})
export class IdeaIncubatorComponent implements OnInit {
  ideas: Idea[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  isLoading = true;
  searchQuery = '';

  // Breadcrumb items
  breadcrumbItems: MenuItem[] = [];
  homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor(
    private ideaService: IdeaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeBreadcrumb();
    this.loadIncubatorIdeas();
  }

  private initializeBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Idea Incubator', routerLink: '/idea-incubator' }
    ];
  }

  loadIncubatorIdeas(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    
    const params = {
      skip: (page - 1) * this.pageSize,
      limit: this.pageSize,
      search: this.searchQuery || undefined,
      sort_by: 'created_at',
      sort_order: 'desc' as 'asc' | 'desc'
    };
    
    this.ideaService.getIncubatorIdeas(params)
      .subscribe({
        next: (response: ApiResponse<Idea[]>) => {
          if (response.success) {
            this.ideas = response.data || [];
            this.totalItems = response.pagination?.total || 0;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading incubator ideas:', error);
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: any): void {
    const page = Math.floor(event.first / event.rows) + 1;
    this.loadIncubatorIdeas(page);
  }

  onSearch(): void {
    this.loadIncubatorIdeas(1);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadIncubatorIdeas(1);
  }

  getReviewStatusSeverity(status: ReviewStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (status) {
      case ReviewStatus.APPROVED:
        return 'success';
      case ReviewStatus.REJECTED:
        return 'danger';
      case ReviewStatus.IN_REVIEW:
        return 'info';
      case ReviewStatus.NEED_IMPROVEMENT:
        return 'warning';
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
    if (!idea.incubator_review) {
      return 'secondary';
    }
    
    return this.getReviewStatusSeverity(idea.incubator_review.status);
  }

  /**
   * Get idea status label based on overall idea status
   */
  getIdeaStatusLabel(idea: Idea): string {
    if (!idea.incubator_review) {
      return 'No Incubator Review';
    }
    
    return this.getReviewStatusLabel(idea.incubator_review.status);
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
    this.router.navigate(['/idea-incubator', id]);
  }

  /**
   * Check if current user can edit the idea incubator review
   */
  canEditIncubatorReview(idea: Idea): boolean {
    const isCreator = idea.creator_id === this.authService.getId();
    const isNeedImprovement = idea.incubator_review?.status === ReviewStatus.NEED_IMPROVEMENT;
    
    return isCreator && isNeedImprovement;
  }

  /**
   * Navigate to incubator review form for editing
   */
  editIncubatorReview(idea: Idea): void {
    this.router.navigate(['/idea-incubator', idea.id, 'edit']);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
} 