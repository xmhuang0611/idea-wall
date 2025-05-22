import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ToastService } from '../../../shared/services/toast.service';
import { SessionService } from '../../../services/session.service';
import { AuthService } from '../../../auth/auth.service';
import { IdeaSession, SessionReview, SessionStatus } from '../../../models/session.model';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-session-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    DialogModule,
    TableModule
  ],
  templateUrl: './session-review.component.html',
  styleUrls: ['./session-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionReviewComponent implements OnInit {
  sessions: IdeaSession[] = [];
  loading: boolean = true;
  
  constructor(
    private router: Router,
    private sessionService: SessionService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.loadSessions();
  }
  
  loadSessions(): void {
    this.loading = true;
    
    // Get list of sessions that need review
    this.sessionService.getSessions({
      status: SessionStatus.IN_REVIEW
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sessions = response.data;
        } else {
          this.toastService.showError('Failed to load sessions');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sessions', error);
        this.toastService.showError('Failed to load sessions');
        this.loading = false;
      }
    });
  }
  
  viewSessionDetails(sessionId: string): void {
    this.router.navigate(['/sessions', sessionId]);
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