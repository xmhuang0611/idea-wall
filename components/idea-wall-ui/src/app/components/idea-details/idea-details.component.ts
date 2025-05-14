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
import { Router } from '@angular/router';

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
  templateUrl: './idea-details.component.html',
  styleUrls: ['./idea-details.component.scss']
})
export class IdeaDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ideaId: string = '';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() commentCountChange = new EventEmitter<{ideaId: string, count: number}>();
  @Output() voteStatusChange = new EventEmitter<{ideaId: string, has_voted: boolean, totalVotes: number}>();
  
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
    private fb: FormBuilder,
    private router: Router
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
    // 使用 history API 直接修改 URL，避免页面重新加载导致的闪动
    window.history.replaceState({}, '', '/');
  }
  
  /**
   * 处理点赞/取消点赞操作
   */
  onVote(): void {
    if (!this.idea) {
      return;
    }
    
    // 切换点赞状态: 如果已点赞则取消 (0), 否则点赞 (1)
    const voteStatus = this.idea.has_voted ? 0 : 1;
    
    this.ideaService.voteIdea(this.idea.id, voteStatus).subscribe({
      next: () => {
        // 更新点赞状态
        if (this.idea) {
          this.idea.has_voted = !this.idea.has_voted;
          
          // 更新点赞数
          if (this.idea.has_voted) {
            this.idea.total_votes += 1;
          } else {
            this.idea.total_votes -= 1;
          }
          
          // 通知父组件更新点赞状态
          this.voteStatusChange.emit({
            ideaId: this.idea.id,
            has_voted: this.idea.has_voted,
            totalVotes: this.idea.total_votes
          });
        }
      },
      error: (error) => {
        console.error('Vote failed', error);
      }
    });
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