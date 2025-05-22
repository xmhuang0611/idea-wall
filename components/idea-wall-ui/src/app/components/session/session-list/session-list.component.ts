import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { SessionService } from '../../../services/session.service';
import { IdeaSession, SessionStatus } from '../../../models/session.model';
import { ToastService } from '../../../shared/services/toast.service';
import { RippleModule } from 'primeng/ripple';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DropdownModule,
    PaginatorModule,
    RippleModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  template: `
    <div class="container">
      <div class="surface-card p-4 shadow-2 border-round mt-4">
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4">
          <h1 class="text-2xl font-semibold mb-3 md:mb-0">Idea Sessions</h1>
          <div class="flex flex-column sm:flex-row gap-3">
            <span class="p-input-icon-left w-full sm:w-22rem">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                pInputText 
                class="w-full" 
                placeholder="Search sessions..." 
                [(ngModel)]="searchTerm"
                (keyup.enter)="loadSessions()"
              />
            </span>
            <p-dropdown 
              [options]="statusOptions" 
              [(ngModel)]="selectedStatus" 
              placeholder="Filter by status"
              [showClear]="true"
              (onChange)="loadSessions()"
              styleClass="w-full sm:w-12rem"
            ></p-dropdown>
          </div>
        </div>
        
        <div *ngIf="loading" class="flex justify-content-center py-6">
          <p-progressSpinner strokeWidth="4"></p-progressSpinner>
        </div>
        
        <p-table 
          *ngIf="!loading"
          [value]="sessions" 
          [paginator]="false"
          [rows]="limit" 
          styleClass="p-datatable-sm p-datatable-gridlines"
          [tableStyle]="{'min-width': '60rem'}"
          [rowHover]="true"
          responsiveLayout="stack"
          [breakpoint]="'960px'"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Title</th>
              <th style="width: 140px">Status</th>
              <th style="width: 200px">Submitter</th>
              <th style="width: 200px">Submit Time</th>
              <th style="width: 100px" class="text-center">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-session>
            <tr>
              <td>
                <span class="p-column-title">Title</span>
                <span class="font-semibold">{{session.title || session.basic_info?.idea_title}}</span>
              </td>
              <td>
                <span class="p-column-title">Status</span>
                <p-tag 
                  [value]="getStatusLabel(session.status)" 
                  [severity]="getStatusSeverity(session.status)"
                  [rounded]="true"
                ></p-tag>
              </td>
              <td>
                <span class="p-column-title">Submitter</span>
                <div>
                  <span>{{session.basic_info?.submitter_name}}</span>
                  <span *ngIf="session.basic_info?.submitter_id" class="text-500 text-sm"> ({{session.basic_info?.submitter_id}})</span>
                </div>
              </td>
              <td>
                <span class="p-column-title">Submit Time</span>
                <span>{{session.created_at | date:'medium'}}</span>
              </td>
              <td class="text-center">
                <span class="p-column-title">Actions</span>
                <button 
                  pButton 
                  pRipple 
                  icon="pi pi-eye" 
                  class="p-button-rounded p-button-text"
                  pTooltip="View Details"
                  tooltipPosition="left"
                  (click)="viewSession(session.id)"
                ></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-4">
                <div *ngIf="totalSessions === 0 && !loading" class="flex flex-column align-items-center">
                  <i class="pi pi-search text-4xl text-500 mb-3"></i>
                  <span class="text-xl font-semibold text-700">No sessions found</span>
                  <p class="text-500 mb-3">Try adjusting your search or filter criteria</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
        
        <p-paginator 
          *ngIf="totalSessions > 0"
          [rows]="limit" 
          [totalRecords]="totalSessions" 
          [rowsPerPageOptions]="[10, 25, 50]"
          (onPageChange)="onPageChange($event)"
        ></p-paginator>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-dropdown {
        width: 100%;
      }
      
      .p-paginator {
        justify-content: flex-end;
        border: none;
        padding-top: 1rem;
      }
      
      .p-tag {
        font-size: 0.75rem;
      }
    }
    
    @media screen and (max-width: 960px) {
      :host ::ng-deep {
        .p-datatable-tbody > tr > td .p-column-title {
          padding-right: 1rem;
          font-weight: 600;
        }
      }
    }
  `]
})
export class SessionListComponent implements OnInit {
  sessions: IdeaSession[] = [];
  loading: boolean = true;
  totalSessions: number = 0;
  
  // Pagination
  skip: number = 0;
  limit: number = 10;
  
  // Filters
  searchTerm: string = '';
  selectedStatus: string | null = null;
  
  statusOptions = [
    { label: 'Pending', value: SessionStatus.PENDING },
    { label: 'In Review', value: SessionStatus.IN_REVIEW },
    { label: 'Approved', value: SessionStatus.APPROVED },
    { label: 'Rejected', value: SessionStatus.REJECTED },
    { label: 'Need Improvement', value: SessionStatus.NEED_IMPROVEMENT },
    { label: 'Resubmitted', value: SessionStatus.RESUBMITTED }
  ];
  
  constructor(
    private sessionService: SessionService,
    private router: Router,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.loadSessions();
  }
  
  loadSessions(): void {
    this.loading = true;
    
    const params: any = {
      skip: this.skip,
      limit: this.limit,
      search: this.searchTerm || undefined,
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }
    
    this.sessionService.getSessions(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.sessions = response.data || [];
          this.totalSessions = (response as any).total || 0;
        } else {
          this.toastService.showError('Failed to load sessions');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading sessions', error);
        this.toastService.showError('Failed to load sessions');
      }
    });
  }
  
  onPageChange(event: any): void {
    this.skip = event.page * event.rows;
    this.limit = event.rows;
    this.loadSessions();
  }
  
  viewSession(id: string): void {
    this.router.navigate(['/sessions', id]);
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