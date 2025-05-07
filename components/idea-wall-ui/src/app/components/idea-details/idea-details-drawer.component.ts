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
        <div class="flex items-center justify-content-between py-2 w-full">
          <h3 class="text-xl font-semibold m-0 text-900">Idea Details</h3>
        </div>
      </ng-template>
      
      <div class="p-fluid idea-container">
        <!-- Idea Details -->
        <div *ngIf="isLoading" class="flex justify-content-center items-center h-full px-3">
          <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
        </div>
        
        <div *ngIf="!isLoading && !idea" class="text-center p-4 surface-ground border-round">
          <i class="pi pi-exclamation-circle text-3xl text-500 mb-3"></i>
          <p class="m-0 font-medium">Idea not found or failed to load.</p>
        </div>
        
        <div *ngIf="!isLoading && idea" class="idea-details">
          <!-- Main content card -->
          <div class="surface-card shadow-3 border-round p-3">
            <!-- Title Section -->
            <div class="flex items-center gap-2 mb-4">
              <h2 class="text-2xl font-semibold m-0 text-900 mr-2">{{idea.title}}</h2>
              <p-chip 
                [label]="idea.category || 'Idea'" 
                [style]="getCategoryStyle(idea.category || 'Idea')"
                styleClass="category-chip mx-2">
              </p-chip>
              <div class="flex items-center gap-1">
                <i class="pi pi-thumbs-up text-primary mr-1"></i>
                <span class="font-medium">{{idea.total_votes}} votes</span>
              </div>
            </div>
            
            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-4">
              <p-tag *ngFor="let tag of idea.tag_details" 
                    [value]="tag.tag_name"
                    [severity]="getTagSeverity(tag.tag_name)"
                    styleClass="tag-item">
              </p-tag>
            </div>
            
            <!-- Creator info and date -->
            <div class="flex items-center text-sm text-600 mb-4 creator-info p-3 border-round">
              <p-avatar 
                icon="pi pi-user" 
                shape="circle" 
                styleClass="flex-shrink-0"
                [style]="{'width': '40px', 'height': '40px', 'background': '#e3f2fd', 'color': '#0ea5e9'}">
              </p-avatar>
              <div class="flex flex-column ml-3">
                <span class="font-medium text-700 mb-1">{{idea.creator_name}}</span>
                <span class="text-sm text-500">{{idea.created_at | date:'medium'}}</span>
              </div>
            </div>
            
            <!-- Description with improved styling -->
            <div class="p-3 border-round description-container">
              <p class="line-height-3 m-0 text-700">{{idea.description}}</p>
            </div>
          </div>
          
          <!-- Comments Section -->
          <div class="surface-card shadow-3 border-round p-3 mt-3">
            <div class="flex items-center justify-content-between mb-3">
              <h3 class="text-xl font-medium m-0 text-900">
                Comments
                <span *ngIf="comments.length > 0" class="comment-count ml-2">{{idea.total_comments}}</span>
              </h3>
            </div>
            
            <div class="comment-input-container mb-4">
              <form [formGroup]="commentForm" class="relative">
                <div class="field mb-0">
                  <textarea 
                    id="comment"
                    pInputTextarea 
                    formControlName="comment" 
                    [rows]="3" 
                    [autoResize]="false"
                    placeholder="Share your thoughts on this idea..."
                    class="w-full comment-textarea">
                  </textarea>
                </div>
                <div class="comment-actions">
                  <button pButton pRipple
                          label="Submit" 
                          icon="pi pi-send"
                          [disabled]="!commentForm.valid"
                          class="p-button-primary p-button-sm"
                          (click)="submitComment()">
                  </button>
                </div>
              </form>
            </div>
            
            <div *ngIf="commentsLoading" class="flex justify-content-center p-3">
              <i class="pi pi-spin pi-spinner text-xl text-primary"></i>
            </div>
            
            <div *ngIf="!commentsLoading && (!comments || comments.length === 0)" class="text-center p-4 surface-ground border-round empty-comments">
              <i class="pi pi-comments text-2xl mb-3 text-500"></i>
              <p class="m-0 text-700">No comments yet. Be the first to share your thoughts!</p>
            </div>
            
            <div *ngIf="!commentsLoading && comments && comments.length > 0" class="comment-list-container">
              <div class="comment-list">
                <div *ngFor="let comment of displayedComments; let last = last" 
                     [class.mb-3]="!last" 
                     class="comment-item">
                  <div class="flex items-center mb-3">
                    <p-avatar 
                      icon="pi pi-user" 
                      shape="circle" 
                      styleClass="flex-shrink-0"
                      [style]="{'width': '32px', 'height': '32px', 'background': '#e3f2fd', 'color': '#0ea5e9'}">
                    </p-avatar>
                    <div class="flex flex-column ml-3">
                      <span class="font-medium text-700 mb-1">{{ comment.creator_name }}</span>
                      <span class="text-xs text-500">{{ comment.created_at | date:'medium' }}</span>
                    </div>
                  </div>
                  <div class="comment-content">
                    <p class="m-0 line-height-3 p-3">{{ comment.description }}</p>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-content-center mt-4">
                <p-paginator 
                  [rows]="commentPageSize" 
                  [totalRecords]="comments.length"
                  [rowsPerPageOptions]="[5, 10, 20]"
                  styleClass="custom-paginator"
                  (onPageChange)="onCommentPageChange($event)">
                </p-paginator>
              </div>
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
      padding: 1rem 0.75rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .comment-list-container {
      display: flex;
      flex-direction: column;
    }
    
    .comment-list {
      max-height: 350px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .idea-container {
        padding: 0.5rem;
      }
      
      .comment-list {
        max-height: 250px;
      }
    }
    
    @media (min-width: 1600px) {
      .comment-list {
        max-height: 450px;
      }
    }
    
    :host ::ng-deep .p-inputtextarea {
      width: 100%;
      min-height: 80px;
      border-color: #e2e8f0;
      font-size: 1rem;
      transition: all 0.2s;
      padding-bottom: 2.5rem !important;
    }
    
    :host ::ng-deep .p-inputtextarea:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    
    :host ::ng-deep .p-avatar {
      display: flex;
      justify-content: center;
      items-center: center;
    }
    
    .comment-input-container {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background-color: #ffffff;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s;
      position: relative;
    }
    
    .comment-input-container:focus-within {
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }
    
    :host ::ng-deep .comment-textarea {
      border: none !important;
      border-radius: 0 !important;
      padding: 1rem !important;
      font-size: 1rem;
      box-shadow: none !important;
      background-color: #ffffff;
    }
    
    .idea-details {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    :host ::ng-deep .p-chip {
      height: 28px !important;
      min-width: 60px;
      justify-content: center;
    }
    
    .line-height-3 {
      line-height: 1.6rem;
    }
    
    .comment-actions {
      position: absolute;
      bottom: 0.5rem;
      right: 1rem;
    }
    
    /* 自定义滚动条样式 */
    :host ::ng-deep ::-webkit-scrollbar {
      width: 6px;
    }
    
    :host ::ng-deep ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    
    :host ::ng-deep ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    
    :host ::ng-deep ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    
    /* 添加自定义样式 */
    :host ::ng-deep .p-sidebar-header {
      background-color: #ffffff;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    
    :host ::ng-deep .p-sidebar-content {
      padding: 0 !important;
      background-color: #f8fafc;
    }
    
    .creator-info {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    
    .description-container {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    
    .comment-item {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid #e2e8f0;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .comment-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .comment-content {
      background-color: #f8fafc;
      border-radius: 6px;
    }
    
    .category-chip {
      font-weight: 500;
      background-color: #e3f2fd !important;
      color: #0ea5e9 !important;
    }
    
    :host ::ng-deep .tag-item {
      border-radius: 6px;
      padding: 0.3rem 0.7rem;
      font-weight: 500;
      margin-right: 0.5rem;
    }
    
    :host ::ng-deep .custom-paginator .p-paginator-page.p-highlight {
      background-color: #2563eb;
      color: #ffffff;
    }
  `]
})
export class IdeaDetailsDrawerComponent implements OnInit, OnChanges, OnDestroy {
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
  
  getCategoryStyle(category: string): any {
    switch (category) {
      case 'Idea':
        return { background: '#e3f2fd', color: '#1565c0' };
      case 'Pain':
        return { background: '#ffebee', color: '#c62828' };
      case 'Thought':
        return { background: '#e8f5e9', color: '#2e7d32' };
      default:
        return { background: '#f5f5f5', color: '#616161' };
    }
  }
}