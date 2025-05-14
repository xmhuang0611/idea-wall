import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { IdeaService } from '../../services/idea.service';
import { Idea } from '../../models/idea.model';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { IdeaDetailsComponent } from '../idea-details/idea-details.component';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { TagService } from '../../services/tag.service';
import { TagUtilService, TagOption } from '../../shared/services/tag-util.service';

@Component({
  selector: 'app-idea-wall',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    TagModule, 
    DividerModule, 
    ButtonModule,
    InputTextModule,
    DropdownModule,
    PanelModule,
    CardModule,
    PaginatorModule,
    InputSwitchModule,
    ProgressSpinnerModule,
    TooltipModule,
    MultiSelectModule,
    IdeaDetailsComponent
  ],
  templateUrl: './idea-wall.component.html',
  styleUrls: ['./idea-wall.component.scss']
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  currentUserId: string = '';
  showMyIdeas: boolean = false;
  
  // Search and filter conditions
  searchQuery = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Tag filter
  availableTags: TagOption[] = [];
  selectedTags: number[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50, 100];

  // Idea Details drawer
  ideaDetailsVisible = false;
  selectedIdeaId = '';

  // 保存每个idea的评论数，用于更新列表显示
  commentCounts: { [ideaId: string]: number } = {};

  isLoading: boolean = false;

  constructor(
    private ideaService: IdeaService,
    private router: Router,
    public authService: AuthService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private tagService: TagService,
    private tagUtilService: TagUtilService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.currentUserId = this.authService.getId();
    }
    
    this.loadTags();
    this.loadIdeas();
    
    // 从路由参数中获取 idea ID 并打开 idea details drawer
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.openDetails(params['id']);
      }
    });
    
    // 检查当前 URL 是否包含 idea ID
    const currentPath = window.location.pathname;
    const ideaIdMatch = currentPath.match(/\/idea\/([^\/]+)/);
    if (ideaIdMatch && ideaIdMatch[1]) {
      this.openDetails(ideaIdMatch[1]);
    }
  }
  
  loadTags(): void {
    this.tagService.getTags().subscribe(tags => {
      this.availableTags = this.tagUtilService.formatTagsForDisplay(tags, true);
    });
  }

  loadIdeas(): void {
    this.isLoading = true;
    const skip = (this.currentPage - 1) * this.pageSize;
    
    const params: any = {
      skip: skip,
      limit: this.pageSize,
      search: this.searchQuery,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };

    if (this.showMyIdeas) {
      params.creator_id = this.currentUserId;
    }
    
    // Add tags filter if selected
    if (this.selectedTags && this.selectedTags.length > 0) {
      params.tags = this.selectedTags;
    }
    
    this.ideaService
      .getIdeas(params)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.ideas = response.data.map(idea => ({
              ...idea,
              created_at: new Date(idea.created_at),
              updated_at: new Date(idea.updated_at)
            }));
            
            if (response.pagination) {
              this.totalItems = response.pagination.total;
            }
            
            console.log('Ideas loaded:', this.ideas.length);
          } else {
            console.error('Failed to load ideas:', response.error);
            this.ideas = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading ideas:', error);
          this.ideas = [];
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onSortChange(): void {
    this.loadIdeas();
  }
  
  onTagFilterChange(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    this.loadIdeas();
  }

  /**
   * Handle vote/unvote operations
   * @param idea The idea to vote on
   */
  onVote(idea: Idea): void {
    // Toggle vote status: if already voted then unvote (0), otherwise vote (1)
    const voteStatus = idea.hasVoted ? 0 : 1;
    
    this.ideaService.voteIdea(idea.id, voteStatus).subscribe({
      next: () => {
        // Update vote status
        idea.hasVoted = !idea.hasVoted;
        
        // Update vote count
        if (idea.hasVoted) {
          idea.total_votes += 1;
        } else {
          idea.total_votes -= 1;
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

  /**
   * 打开idea详情抽屉
   * @param ideaId 
   */
  openDetails(ideaId: string): void {
    this.selectedIdeaId = ideaId;
    this.ideaDetailsVisible = false;
    
    // 使用 history API 更新 URL，避免页面重新加载导致的闪动
    window.history.replaceState({}, '', `/idea/${ideaId}`);
    
    // 直接获取评论数据
    this.ideaService.getComments(ideaId).subscribe({
      next: (commentsResponse) => {
        if (commentsResponse.success && Array.isArray(commentsResponse.data)) {
          const commentCount = commentsResponse.data.length;
          // 更新评论数缓存
          this.commentCounts[ideaId] = commentCount;
          
          // 更新当前列表中的评论数
          const idea = this.ideas.find(i => i.id === ideaId);
          if (idea && idea.total_comments !== commentCount) {
            console.log(`Updating comment count before opening details: ${commentCount}`);
            idea.total_comments = commentCount;
          }
        }
        
        // 打开详情抽屉
        setTimeout(() => {
          this.ideaDetailsVisible = true;
        }, 0);
      },
      error: () => {
        // 即使获取评论失败，也要打开详情页
        setTimeout(() => {
          this.ideaDetailsVisible = true;
        }, 0);
      }
    });
  }

  /**
   * 处理评论数量变化事件
   * @param event {ideaId: string, count: number} 
   */
  onCommentCountChange(event: {ideaId: string, count: number}): void {
    // 更新指定idea的评论数
    const idea = this.ideas.find(i => i.id === event.ideaId);
    if (idea && idea.total_comments !== event.count) {
      console.log(`Updating comment count for idea ${event.ideaId}: ${event.count}`);
      idea.total_comments = event.count;
    }
  }

  /**
   * 处理来自idea-details组件的点赞状态变化事件
   * @param event 包含ideaId、hasVoted和totalVotes的事件对象
   */
  onVoteStatusChange(event: {ideaId: string, hasVoted: boolean, totalVotes: number}): void {
    // 更新指定idea的点赞状态和点赞数
    const idea = this.ideas.find(i => i.id === event.ideaId);
    if (idea) {
      console.log(`Updating vote status for idea ${event.ideaId}: hasVoted=${event.hasVoted}, totalVotes=${event.totalVotes}`);
      idea.hasVoted = event.hasVoted;
      idea.total_votes = event.totalVotes;
    }
  }
  
  // 添加编辑Idea方法
  editIdea(ideaId: string): void {
    this.router.navigate(['/submit-idea', ideaId]);
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

  onMyIdeasChange(checked: boolean): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  /**
   * 分享idea链接
   * @param ideaId 
   */
  shareIdea(ideaId: string): void {
    // 构建idea的完整URL
    const baseUrl = window.location.origin;
    const ideaUrl = `${baseUrl}/idea/${ideaId}`;
    
    // 使用Clipboard API复制链接
    navigator.clipboard.writeText(ideaUrl)
      .then(() => {
        this.toastService.showSuccess('Link copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        this.toastService.showError('Failed to copy link');
      });
  }
} 