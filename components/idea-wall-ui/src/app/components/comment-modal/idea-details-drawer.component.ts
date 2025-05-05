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
    PaginatorModule
  ],
  template: `
    <p-sidebar 
      [(visible)]="visible" 
      position="right" 
      [style]="{ width: sidebarWidth, maxWidth: '1000px' }"
      [baseZIndex]="10000"
      (onHide)="onSidebarHide()">
      <ng-template pTemplate="header">
        <div class="flex align-items-center">
          <h3 class="m-0">Idea Details</h3>
        </div>
      </ng-template>
      
      <div class="p-fluid idea-container">
        <!-- Idea Details -->
        <div *ngIf="isLoading" class="flex justify-content-center px-5">
          <i class="pi pi-spin pi-spinner text-3xl"></i>
        </div>
        
        <div *ngIf="!isLoading && !idea" class="text-center p-5">
          <p>Idea not found or failed to load.</p>
        </div>
        
        <div *ngIf="!isLoading && idea" class="idea-details">
          <!-- Main content card -->
          <div class="surface-card shadow-2 border-round p-4 mb-4">
            <h2 class="text-xl font-semibold mb-2 mt-0">{{idea.title}}</h2>
            
            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-3">
              <p-tag *ngFor="let tag of idea.tag_details" 
                     [value]="tag.tag"
                     [severity]="getTagSeverity(tag.tag)">
              </p-tag>
            </div>
            
            <!-- Creator info and date -->
            <div class="flex align-items-center text-sm text-500 mb-3">
              <div class="flex align-items-center">
                <div class="flex justify-content-center align-items-center mr-2" style="width: 32px; height: 32px">
                  <p-avatar 
                    icon="pi pi-user" 
                    shape="circle" 
                    styleClass="flex-shrink-0"
                    [style]="{'width': '32px', 'height': '32px'}">
                  </p-avatar>
                </div>
                <div>
                  <span class="font-medium text-700">{{idea.creator_name}}</span>
                  <span class="mx-2">•</span>
                  <span>{{idea.created_at | date:'medium'}}</span>
                </div>
              </div>
            </div>
            
            <!-- Description -->
            <div class="mb-3 p-2 surface-ground border-round">
              <p class="line-height-3 m-0">{{idea.description}}</p>
            </div>
            
            <!-- Vote info -->
            <div class="flex align-items-center">
              <div class="flex align-items-center">
                <i class="{{idea.hasVoted ? 'pi pi-thumbs-up-fill' : 'pi pi-thumbs-up'}} text-primary mr-2 flex align-items-center justify-content-center" style="font-size: 1.25rem"></i>
                <span class="font-medium">{{idea.total_votes}} votes</span>
              </div>
            </div>
          </div>
          
          <!-- Comments Section -->
          <div class="surface-card shadow-2 border-round p-4">
            <h3 class="text-lg font-medium mb-3">
              Comments
              <span *ngIf="comments.length > 0" class="text-sm font-normal text-500 ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">({{comments.length}})</span>
            </h3>
            
            <div class="comment-input-container mb-4">
              <form [formGroup]="commentForm">
                <div class="field mb-0">
                  <textarea 
                    id="comment"
                    pInputTextarea 
                    formControlName="comment" 
                    [rows]="3" 
                    [autoResize]="false"
                    placeholder="Share your comment here"
                    class="w-full comment-textarea">
                  </textarea>
                </div>
              </form>
            </div>
            <div class="comment-actions">
              <button pButton 
                      label="Submit" 
                      icon="pi pi-send"
                      [disabled]="!commentForm.valid"
                      class="p-button-primary p-button-sm"
                      (click)="submitComment()"
                      style="width: 80px;">
              </button>
            </div>
            
            <div *ngIf="commentsLoading" class="flex justify-content-center p-3">
              <i class="pi pi-spin pi-spinner text-xl"></i>
            </div>
            
            <div *ngIf="!commentsLoading && (!comments || comments.length === 0)" class="text-center p-3 surface-ground border-round">
              <i class="pi pi-comments text-xl mb-2 text-500"></i>
              <p class="m-0">No comments yet. Be the first to comment!</p>
            </div>
            
            <div *ngIf="!commentsLoading && comments && comments.length > 0" class="comment-list-container">
              <!-- 评论列表 -->
              <div class="comment-list">
                <div *ngFor="let comment of displayedComments; let last = last" 
                     [class.mb-3]="!last" 
                     class="border-bottom-1 surface-border pb-3">
                  <div class="flex mb-2">
                    <div class="flex justify-content-center align-items-center mr-2" style="width: 32px; height: 32px">
                      <p-avatar 
                        icon="pi pi-user" 
                        shape="circle" 
                        styleClass="flex-shrink-0"
                        [style]="{'width': '32px', 'height': '32px'}">
                      </p-avatar>
                    </div>
                    <div>
                      <div class="font-medium">{{ comment.creator_name }}</div>
                      <div class="text-sm text-500">
                        {{ comment.created_at | date:'medium' }}
                      </div>
                    </div>
                  </div>
                  <p class="m-0 line-height-3 p-2">{{ comment.description }}</p>
                </div>
              </div>
              
              <!-- 分页控件 -->
              <div class="flex justify-content-center mt-3">
                <p-paginator 
                  [rows]="commentPageSize" 
                  [totalRecords]="comments.length"
                  [rowsPerPageOptions]="[5, 10, 20]"
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
      padding: 1rem;
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
    }
    
    :host ::ng-deep .p-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .comment-input-container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #ffffff;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
    }
    
    :host ::ng-deep .p-chip {
      height: auto;
    }
    
    .line-height-3 {
      line-height: 1.5rem;
    }
    
    .comment-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    
    /* 自定义滚动条样式 */
    :host ::ng-deep ::-webkit-scrollbar {
      width: 8px;
    }
    
    :host ::ng-deep ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    :host ::ng-deep ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    :host ::ng-deep ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
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
    if (!this.ideaId) return;
    
    this.commentsLoading = true;
    console.log('Loading comments for idea:', this.ideaId);
    
    this.ideaService.getComments(this.ideaId).subscribe({
      next: (response: any) => {
        console.log('Comments response structure:', response);
        
        // 初始化评论数组
        this.comments = [];
        
        // 检查response及其data字段
        if (!response) {
          console.error('Empty response received');
          this.commentsLoading = false;
          this.commentCountChange.emit({ ideaId: this.ideaId, count: 0 });
          return;
        }
        
        // 处理旧版API直接返回数组的情况
        if (Array.isArray(response)) {
          console.log('Direct array response detected');
          this.processComments(response);
        } 
        // 处理新版API返回标准包装对象的情况
        else if (response.success && response.data) {
          console.log('Standard wrapped response detected');
          if (Array.isArray(response.data)) {
            this.processComments(response.data);
          } else {
            console.error('Response data is not an array:', response.data);
          }
        } 
        // 处理异常情况
        else {
          console.error('Unexpected response format:', response);
        }
        
        this.commentsLoading = false;
        this.commentCountChange.emit({
          ideaId: this.ideaId,
          count: this.comments.length
        });
      },
      error: (error: any) => {
        console.error('Failed to load comments:', error);
        this.comments = [];
        this.commentsLoading = false;
        
        this.commentCountChange.emit({
          ideaId: this.ideaId,
          count: 0
        });
      }
    });
  }
  
  // 处理comments数据的辅助方法
  private processComments(commentsData: any[]): void {
    console.log('Processing comments data, count:', commentsData.length);
    console.log('First item sample:', commentsData.length > 0 ? commentsData[0] : 'No comments');
    
    // 遍历并处理评论数据
    this.comments = commentsData.map((comment: any) => {
      console.log('Processing comment item:', comment);
      
      // 创建一个新对象确保结构符合前端模型
      const processedComment: Comment = {
        id: comment.id || (comment as any)._id || '',
        idea_id: comment.idea_id || this.ideaId,
        description: comment.description || '',
        parent_id: comment.parent_id,
        votes: comment.votes || 0,
        created_at: typeof comment.created_at === 'string' ? new Date(comment.created_at) : comment.created_at,
        creator_id: comment.creator_id || '',
        creator_name: comment.creator_name || 'Anonymous User',
        updated_at: typeof comment.updated_at === 'string' ? new Date(comment.updated_at) : comment.updated_at,
        updater_id: comment.updater_id,
        updater_name: comment.updater_name
      };
      
      return processedComment;
    });
    
    // 确保评论按时间倒序排列（最新的在最前面）
    this.comments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log('Processed comments successfully, count:', this.comments.length);
    
    // 更新分页显示
    this.updateDisplayedComments();
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
    if (this.commentForm.invalid || this.isSubmitting) return;
    
    const commentText = this.commentForm.get('comment')?.value;
    this.isSubmitting = true;
    
    console.log('Submitting comment:', commentText);
    
    this.ideaService.addComment(this.ideaId, commentText).subscribe({
      next: (response) => {
        console.log('Comment submission response:', response);
        if (response.success) {
          this.commentForm.reset();
          // 确保评论框失去焦点
          const textarea = document.getElementById('comment') as HTMLTextAreaElement;
          if (textarea) {
            textarea.blur();
          }
          
          // 设置短暂延迟后再加载评论，确保后端数据已更新
          setTimeout(() => {
            this.loadComments();
          }, 300);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Failed to post comment:', error);
        this.isSubmitting = false;
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