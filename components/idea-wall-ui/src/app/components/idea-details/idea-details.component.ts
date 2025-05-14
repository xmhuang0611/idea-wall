import { Component, EventEmitter, Input, OnChanges, OnInit, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { PaginatorModule } from 'primeng/paginator';
import { ChipModule } from 'primeng/chip';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { IdeaService } from '../../services/idea.service';
import { Comment } from '../../models/comment.model';
import { Idea } from '../../models/idea.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-idea-details-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    SidebarModule,
    CardModule,
    DividerModule,
    AvatarModule,
    InputTextareaModule,
    TagModule,
    BadgeModule,
    PaginatorModule,
    ChipModule,
    RippleModule,
    TooltipModule
  ],
  template: `
    <p-sidebar 
      [(visible)]="visible" 
      position="right" 
      [style]="{ width: sidebarWidth, maxWidth: '1000px' }"
      [baseZIndex]="10000"
      styleClass="idea-details-sidebar"
      (onHide)="onSidebarHide()">
      <ng-template pTemplate="header">
        <div class="flex align-items-center justify-content-between py-2 w-full">
          <h3 class="text-xl font-semibold m-0 text-900">Idea Details</h3>
        </div>
      </ng-template>
      
      <div class="p-fluid idea-container">
        <div *ngIf="isLoading" class="flex justify-content-center align-items-center h-full">
          <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
        </div>
        
        <div *ngIf="!isLoading && !idea" class="text-center surface-ground border-round p-4">
          <i class="pi pi-exclamation-circle text-3xl text-500 mb-3"></i>
          <p class="m-0 font-medium">Idea not found or failed to load.</p>
        </div>
        
        <div *ngIf="!isLoading && idea" class="idea-details">
          <!-- Main content -->
          <div class="surface-card shadow-1 border-round p-4 mb-3">
            <!-- Title and Actions -->
            <div class="flex align-items-center justify-content-between mb-2">
              <div class="flex align-items-center gap-2">
                <div class="feeling-image-container">
                  <img [src]="getFeelingImage(idea.feeling)"
                       [alt]="getFeelingLabel(idea.feeling)"
                       class="feeling-image"
                       [title]="getFeelingLabel(idea.feeling)">
                </div>
                <h2 class="text-2xl font-semibold m-0 text-900">{{idea.title}}</h2>
              </div>
              <div class="flex align-items-center">
                <button pButton pRipple 
                        [class]="idea.hasVoted ? 'p-button-primary' : 'p-button-outlined'"
                        icon="pi pi-thumbs-up"
                        [label]="idea.total_votes.toString()"
                        class="idea-details-button mr-2">
                </button>
                <button pButton pRipple 
                        icon="pi pi-comments"
                        [label]="idea.total_comments.toString()"
                        class="idea-details-button p-button-outlined">
                </button>
              </div>
            </div>
            
            <!-- Tags -->
            <div class="flex flex-wrap mb-2">
              <p-tag *ngFor="let tag of idea.tag_details" 
                    [value]="tag.tag_name"
                    [severity]="getTagSeverity(tag.tag_name)"
                    styleClass="tag-item mr-2 mb-1">
              </p-tag>
            </div>
            
            <!-- Creator info -->
            <div class="flex align-items-center mb-2 creator-info p-2 border-round">
              <p-avatar 
                icon="pi pi-user" 
                shape="circle"
                [style]="{'width': '2rem', 'height': '2rem'}"
                class="mr-2">
              </p-avatar>
              <span class="font-medium text-900 mr-2">{{idea.creator_name}}</span>
              <span class="text-xs text-400">{{idea.created_at | date:'medium'}}</span>
            </div>
            
            <!-- Description -->
            <div class="description-container p-2 border-round">
              <p class="line-height-3 m-0 text-700 white-space-pre-line">{{idea.description}}</p>
            </div>
          </div>
          
          <!-- Comments Section -->
          <div class="surface-card shadow-1 border-round p-3">
            <div class="flex align-items-center justify-content-between mb-2">
              <h3 class="text-xl font-medium m-0 text-900">
                Comments
                <span *ngIf="comments.length > 0" class="text-xl text-500">({{idea.total_comments}})</span>
              </h3>
            </div>
            
            <!-- Comment Input -->
            <div class="comment-input-container mb-3">
              <form [formGroup]="commentForm" class="relative">
                <textarea 
                  pInputTextarea 
                  formControlName="comment" 
                  [rows]="2" 
                  [autoResize]="false"
                  placeholder="Share your comments here"
                  class="w-full comment-textarea">
                </textarea>
                <div class="comment-actions">
                  <button pButton pRipple
                          label="Submit" 
                          icon="pi pi-send"
                          [disabled]="!commentForm.valid || isSubmitting"
                          [loading]="isSubmitting"
                          class="p-button-primary p-button-sm"
                          (click)="submitComment()">
                  </button>
                </div>
              </form>
            </div>
            
            <!-- Comments List -->
            <div *ngIf="commentsLoading" class="flex justify-content-center py-2">
              <i class="pi pi-spin pi-spinner text-xl text-primary"></i>
            </div>
            
            <div *ngIf="!commentsLoading && (!comments || comments.length === 0)" 
                 class="text-center surface-ground border-round p-3">
              <i class="pi pi-comments text-2xl text-500 mb-2"></i>
              <p class="m-0 text-700">No comments yet. Be the first to share your comments!</p>
            </div>
            
            <div *ngIf="!commentsLoading && comments.length > 0" class="comments-section">
              <div class="comment-list">
                <div *ngFor="let comment of displayedComments" class="comment-item p-2 mb-2">
                  <div class="flex align-items-center mb-1">
                    <p-avatar 
                      icon="pi pi-user" 
                      shape="circle"
                      [style]="{'width': '2rem', 'height': '2rem'}"
                      class="mr-2">
                    </p-avatar>
                    <span class="font-medium text-900 mr-2">{{comment.creator_name}}</span>
                    <span class="text-xs text-400">{{comment.created_at | date:'medium'}}</span>
                  </div>
                  <p class="m-0 line-height-3 text-700 pl-4">{{comment.description}}</p>
                </div>
              </div>
              
              <p-paginator
                [rows]="commentPageSize" 
                [totalRecords]="comments.length"
                [rowsPerPageOptions]="[5, 10, 20]"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="{first}-{last} of {totalRecords}"
                styleClass="idea-details-paginator border-none mt-2"
                (onPageChange)="onCommentPageChange($event)">
              </p-paginator>
            </div>
          </div>
        </div>
      </div>
    </p-sidebar>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .idea-container {
      height: 100%;
      padding: 0 1.25rem 1.25rem 1.25rem;
      overflow-y: auto;
    }
    
    .idea-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .white-space-pre-line {
      white-space: pre-line;
    }
    
    .creator-info {
      background-color: var(--surface-ground);
    }
    
    .description-container {
      background-color: var(--surface-ground);
    }
    
    .comment-input-container {
      position: relative;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      transition: all 0.2s;
    }
    
    .comment-input-container:focus-within {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    
    .comment-textarea {
      border: none !important;
      background: transparent !important;
      padding: 0.75rem !important;
      padding-bottom: 2.5rem !important;
      resize: none !important;
    }
    
    .comment-actions {
      position: absolute;
      bottom: 0.5rem;
      right: 0.75rem;
    }
    
    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .comment-item {
      background: var(--surface-ground);
      border-radius: 6px;
      transition: all 0.2s;
    }
    
    .comment-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-1);
    }

    .idea-details-sidebar {
      .p-sidebar-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--surface-border);
      }
      
      .p-sidebar-content {
        padding: 0 !important;
      }
    }
    
    .idea-details-chip {
      height: 28px;
      border-radius: 12px;
      background: var(--surface-200);
      color: var(--surface-900);
      font-weight: 500;
    }
    
    .tag-item {
      border-radius: 4px;
      padding: 0.25rem 0.75rem;
      font-weight: 500;
    }
    
    .idea-details-button {
      padding: 0.2rem 0.75rem;
      min-width: 70px;
      
      .p-button-icon {
        font-size: 0.875rem;
      }
    }
    
    .idea-details-paginator {
      padding: 0.5rem 0;
      
      .p-paginator-element {
        min-width: 2rem;
        height: 2rem;
      }

      .p-paginator-current {
        font-size: 1rem;
        color: var(--text-color-secondary);
      }

      .p-paginator-page-options {
        .p-dropdown {
          height: 2rem;
          min-width: 4rem;
        }
      }
    }
    
    .text-xs {
      font-size: 0.75rem !important;
    }
    
    @media screen and (max-width: 768px) {
      .idea-container {
        padding: 0 1rem 1rem 1rem;
      }
    }

    .feeling-image-container {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
    }
    
    .feeling-image {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    @media screen and (max-width: 768px) {
      .feeling-image-container {
        width: 32px;
        height: 32px;
      }
      
      .feeling-image {
        width: 28px;
        height: 28px;
      }
    }
  `]
})
export class IdeaDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ideaId: string = '';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() commentCountChange = new EventEmitter<{ideaId: string, count: number}>();
  
  idea: Idea | null = null;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isLoading: boolean = false;
  commentsLoading: boolean = false;
  isSubmitting: boolean = false;
  commentPageSize: number = 5;
  displayedComments: Comment[] = [];
  sidebarWidth: string = '50vw';
  
  constructor(
    private ideaService: IdeaService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
    this.setResponsiveWidth();
  }
  
  ngOnInit(): void {
    this.loadIdeaDetails();
    // 监听窗口大小变化
    window.addEventListener('resize', this.onResize.bind(this));
  }
  
  ngOnDestroy(): void {
    // 清理事件监听器
    window.removeEventListener('resize', this.onResize.bind(this));
  }
  
  // 窗口大小变化时调整抽屉宽度
  onResize(): void {
    this.setResponsiveWidth();
  }
  
  // 根据屏幕宽度设置响应式宽度
  setResponsiveWidth(): void {
    const screenWidth = window.innerWidth;
    
    if (screenWidth < 768) {
      // 移动设备上使用更大比例
      this.sidebarWidth = '85vw';
    } else if (screenWidth < 1200) {
      // 平板上使用中等比例
      this.sidebarWidth = '65vw';
    } else {
      // 桌面上使用一半宽度
      this.sidebarWidth = '50vw';
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] && changes['visible'].currentValue) || 
        (changes['ideaId'] && this.visible)) {
      console.log('Data changed, loading idea details:', 
        { visible: this.visible, ideaId: this.ideaId });
      this.loadIdeaDetails();
    }
  }
  
  loadIdeaDetails(): void {
    if (!this.ideaId || !this.visible) {
      console.log('Skipping idea details load due to:', 
        { ideaId: !this.ideaId ? 'missing' : 'present', visible: this.visible });
      return;
    }
    
    this.isLoading = true;
    console.log('Loading idea details for ID:', this.ideaId);
    
    this.ideaService.getIdeaById(this.ideaId).subscribe({
      next: (response: any) => {
        console.log('Idea details response:', response);
        if (response.data) {
          this.idea = response.data;
          this.loadComments();
        } else {
          this.idea = null;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load idea details', error);
        this.idea = null;
        this.isLoading = false;
      }
    });
  }
  
  loadComments(): void {
    if (!this.ideaId) {
      console.error('Cannot load comments: No idea ID provided');
      return;
    }

    this.commentsLoading = true;
    
    this.ideaService.getComments(this.ideaId)
      .subscribe({
        next: (response) => {
          this.commentsLoading = false;
          
          if (response.success && response.data) {
            this.comments = response.data.map(comment => ({
              ...comment,
              created_at: comment.created_at ? new Date(comment.created_at) : new Date(),
              updated_at: comment.updated_at ? new Date(comment.updated_at) : new Date()
            }));
            
            // 更新评论数并通知父组件
            if (this.idea) {
              this.idea.total_comments = this.comments.length;
              this.commentCountChange.emit({
                ideaId: this.ideaId,
                count: this.comments.length
              });
            }
            
            this.updateDisplayedComments();
            console.log(`Loaded ${this.comments.length} comments`);
          } else {
            console.error('Failed to load comments:', response.error);
            this.comments = [];
            this.updateDisplayedComments();
          }
        },
        error: (error) => {
          this.commentsLoading = false;
          console.error('Error loading comments:', error);
          this.comments = [];
          this.updateDisplayedComments();
        }
      });
  }
  
  // 更新当前页显示的评论
  private updateDisplayedComments(): void {
    // 默认显示第一页
    this.displayedComments = this.comments.slice(0, this.commentPageSize);
  }
  
  // 处理分页变化
  onCommentPageChange(event: any): void {
    const pageIndex = event.page;
    const pageSize = event.rows;
    this.commentPageSize = pageSize;
    
    // 计算当前页的评论数据
    const startIndex = pageIndex * pageSize;
    this.displayedComments = this.comments.slice(startIndex, startIndex + pageSize);
  }
  
  submitComment(): void {
    if (!this.commentForm.valid || !this.ideaId || this.isSubmitting) {
      return;
    }
    
    const comment = this.commentForm.get('comment')?.value;
    
    if (!comment || comment.trim() === '') {
      return;
    }
    
    this.isSubmitting = true;
    
    this.ideaService.addComment(this.ideaId, comment)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            // 重置表单
            this.commentForm.reset();
            
            // 重新加载评论
            this.loadComments();
          } else {
            console.error('Failed to submit comment:', response.error);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error submitting comment:', error);
        }
      });
  }
  
  onSidebarHide(): void {
    this.visibleChange.emit(false);
  }
  
  getTagSeverity(tag: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    // Return different severities based on tag content to achieve different colors
    const tagMap: {[key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary'} = {
      'urgent': 'danger',
      'important': 'warning',
      'feature': 'info',
      'enhancement': 'success',
      'bug': 'danger',
      'documentation': 'info',
      'discussion': 'secondary'
    };
    
    const lowerTag = tag.toLowerCase();
    for (const key in tagMap) {
      if (lowerTag.includes(key)) {
        return tagMap[key];
      }
    }
    
    // Default color
    return 'info';
  }
  
  getFeelingImage(feeling: number): string {
    return `assets/images/${feeling}-${this.getFeelingEmoji(feeling)}.png`;
  }

  getFeelingLabel(feeling: number): string {
    const labels = ['Unhappy', 'Terrible', 'Thoughtable', 'Happy', 'Unbelievable'];
    return labels[feeling - 1] || '';
  }

  getFeelingEmoji(feeling: number): string {
    const emojis = ['1f92c', '1f621', '1f615', '1f604', '1f929'];
    return emojis[feeling - 1] || '';
  }
}