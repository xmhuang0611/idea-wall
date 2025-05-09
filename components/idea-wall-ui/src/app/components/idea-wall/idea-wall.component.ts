import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { IdeaService } from '../../services/idea.service';
import { Idea } from '../../models/idea.model';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { IdeaDetailsDrawerComponent } from '../idea-details/idea-details-drawer.component';
import { AuthService } from '../../auth/auth.service';

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
    IdeaDetailsDrawerComponent
  ],
  template: `
    <div class="shadow-lg border-round bg-white mb-5">
      <!-- Header with Tabs -->
      <div class="mb-5 p-4">
        <div class="flex justify-content-between align-items-center mb-3">
          <div class="flex align-items-center">
            <div class="p-1">
              <button *ngFor="let cat of categories"
                      (click)="onCategorySelect(cat)"
                      pButton
                      [label]="cat"
                      [class]="selectedCategory === cat ? 'p-button-primary' : 'p-button-secondary p-button-outlined'"
                      class="p-button-sm mr-1">
              </button>
            </div>
          </div>
          <button pButton
                  pRipple
                  icon="pi pi-plus"
                  label="Submit Your Idea"
                  routerLink="/submit-idea"
                  [disabled]="!authService.isLoggedIn()"
                  class="p-button-rounded"
                  (click)="!authService.isLoggedIn() && $event.preventDefault()">
          </button>
        </div>

        <!-- Filters -->
        <div class="grid">
          <!-- Search -->
          <div class="col-12 md:col-8">
            <label class="block mb-1">Search</label>
            <div class="p-inputgroup">
              <input type="text"
                     pInputText
                     [(ngModel)]="searchQuery"
                     (input)="onSearch()"
                     placeholder="Search ideas...">
              <span class="p-inputgroup-addon">
                <i class="pi pi-search"></i>
              </span>
            </div>
          </div>

          <!-- Sort -->
          <div class="col-12 md:col-4">
            <label class="block mb-1">Sort By</label>
            <p-dropdown 
                [options]="[
                  {label: 'Latest Created', value: 'created_at'},
                  {label: 'Most Popular', value: 'total_votes'}
                ]"
                [(ngModel)]="sortBy"
                (onChange)="onSortChange()"
                class="w-full">
            </p-dropdown>
          </div>
        </div>
      </div>

      <!-- Ideas List -->
      <div class="p-4">
        <div *ngFor="let idea of ideas"
             class="mb-3 p-3 border-1 border-round border-300 surface-0">
          <div class="flex">
            <!-- Vote Column -->
            <div class="flex flex-column align-items-center mr-3" style="width: 80px">
              <button pButton
                      pRipple
                      (click)="onVote(idea)"
                      class="p-button-rounded p-button-text"
                      [class.p-button-secondary]="!idea.hasVoted"
                      [class.p-button-primary]="idea.hasVoted"
                      icon="pi pi-thumbs-up"
                      title="{{idea.hasVoted ? 'Unvote' : 'Vote'}}">
              </button>
              <span class="mt-1 font-bold">{{idea.total_votes}}</span>
            </div>

            <!-- Content Column -->
            <div class="flex-1">
              <div class="flex justify-content-between align-items-center mb-2">
                <h3 class="text-primary m-0 cursor-pointer" 
                    (click)="openDetails(idea.id)">
                  {{idea.title}}
                </h3>
                <button *ngIf="idea.creator_id === currentUserId"
                        pButton
                        icon="pi pi-pencil"
                        class="p-button-rounded p-button-text p-button-sm"
                        (click)="editIdea(idea.id)"
                        title="Edit Idea">
                </button>
              </div>
              <p class="mb-3">{{idea.description}}</p>
              
              <!-- Tags -->
              <div class="flex flex-wrap mb-3">
                <p-tag *ngFor="let tag of idea.tag_details" 
                      [value]="tag.tag_name"
                      [severity]="getTagSeverity(tag.tag_name)"
                      class="mr-1 mb-1">
                </p-tag>
              </div>
              
              <p-divider></p-divider>
              
              <div class="flex justify-content-between align-items-center">
                <div>
                  <button pButton
                          pRipple
                          icon="pi pi-comment"
                          (click)="openDetails(idea.id)" 
                          label="{{ idea.total_comments || 0 }}"
                          class="p-button-text p-button-sm">
                  </button>
                </div>
                <div class="flex align-items-center">
                  <span>By {{idea.creator_name}}</span>
                  <span class="mx-1 hidden sm:inline">•</span>
                  <span class="hidden sm:inline">{{idea.created_at | date:'medium'}}</span>
                  <span class="sm:hidden">{{idea.created_at | date:'short'}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-4 p-4 flex flex-column md:flex-row justify-content-between align-items-center">
        <div class="flex align-items-center">
          <div class="mr-3">
            Show
            <p-dropdown 
                [options]="pageSizeOptions"
                [(ngModel)]="pageSize"
                (onChange)="onPageSizeChange()"
                class="mx-2">
            </p-dropdown>
            items per page
          </div>
          <div>
            Showing {{(currentPage - 1) * pageSize + 1}} - {{Math.min(currentPage * pageSize, totalItems)}} of {{totalItems}} items
          </div>
        </div>
        <div class="flex align-items-center mt-3 mt-md-0">
          <button pButton
                  label="First"
                  class="p-button-text p-button-sm"
                  (click)="onPageChange(1)"
                  [disabled]="currentPage === 1">
          </button>
          <button pButton
                  label="Previous"
                  class="p-button-text p-button-sm"
                  (click)="onPageChange(currentPage - 1)"
                  [disabled]="currentPage === 1">
          </button>
          <ng-container *ngFor="let page of getPageNumbers()">
            <button *ngIf="page !== '...'"
                    pButton
                    [label]="page.toString()"
                    class="p-button-text p-button-sm"
                    [class.p-button-primary]="currentPage === +page"
                    (click)="onPageChange(+page)">
            </button>
            <span *ngIf="page === '...'" class="mx-1">...</span>
          </ng-container>
          <button pButton
                  label="Next"
                  class="p-button-text p-button-sm"
                  (click)="onPageChange(currentPage + 1)"
                  [disabled]="currentPage === getTotalPages()">
          </button>
          <button pButton
                  label="Last"
                  class="p-button-text p-button-sm"
                  (click)="onPageChange(getTotalPages())"
                  [disabled]="currentPage === getTotalPages()">
          </button>
        </div>
      </div>
    </div>

    <!-- Idea Details Drawer -->
    <app-idea-details-drawer
      [ideaId]="selectedIdeaId"
      [visible]="ideaDetailsVisible"
      (visibleChange)="ideaDetailsVisible = $event"
      (commentCountChange)="onCommentCountChange($event)">
    </app-idea-details-drawer>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .idea-title {
      color: var(--primary-color);
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .idea-card {
      transition: all 0.2s ease;
    }
    
    .idea-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  currentUserId: string = '';
  
  // Search and filter conditions
  searchQuery = '';
  selectedCategory = 'Idea';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50, 100];

  // Category options
  categories = ['Idea', 'Pain', 'Thought'];
  
  // Idea Details drawer
  ideaDetailsVisible = false;
  selectedIdeaId = '';

  // 保存每个idea的评论数，用于更新列表显示
  commentCounts: { [ideaId: string]: number } = {};

  constructor(
    private ideaService: IdeaService,
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.currentUserId = this.authService.getId();
    }
    this.loadIdeas();
  }

  loadIdeas(): void {
    const skip = (this.currentPage - 1) * this.pageSize;
    
    this.ideaService
      .getIdeas({
        skip: skip,
        limit: this.pageSize,
        category: this.selectedCategory,
        search: this.searchQuery,
        sort_by: this.sortBy,
        sort_order: this.sortOrder
      })
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
        },
        error: (error) => {
          console.error('Error loading ideas:', error);
          this.ideas = [];
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onSortChange(): void {
    this.loadIdeas();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
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

  getCategoryClass(category: string): string {
    switch (category) {
      case 'Idea':
        return 'bg-blue-100 text-blue-800';
      case 'Pain':
        return 'bg-red-100 text-red-800';
      case 'Thought':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.loadIdeas();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  getPageNumbers(): (string | number)[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const pages: (string | number)[] = [];
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);
    
    if (current > 3) {
      pages.push('...');
    }

    // Page numbers around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(current + 1, totalPages - 1); i++) {
      pages.push(i);
    }

    if (current < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  /**
   * 打开idea详情抽屉
   * @param ideaId 
   */
  openDetails(ideaId: string): void {
    this.selectedIdeaId = ideaId;
    this.ideaDetailsVisible = false;
    
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
    console.log('Comment count change event received:', event);
    
    // 更新本地评论数缓存
    this.commentCounts[event.ideaId] = event.count;
    
    // 更新当前显示列表中的评论数
    if (this.ideas && this.ideas.length) {
      const idea = this.ideas.find(i => i.id === event.ideaId);
      if (idea) {
        // 仅当评论数不同时才更新
        if (idea.total_comments !== event.count) {
          console.log(`Updating idea ${idea.id} comment count from ${idea.total_comments} to ${event.count}`);
          idea.total_comments = event.count;
          
          // 可选：如果需要确保与后端同步，可以直接更新数据库中的评论计数
          // 通常不需要这样做，因为后端在添加或删除评论时会自动更新total_comments字段
          // 但如果发现数据不一致，可以考虑调用API更新
          this.ideaService.getIdeaById(event.ideaId).subscribe({
            next: (response) => {
              if (response.success && response.data) {
                // 再次验证评论数是否同步
                if (idea.total_comments !== response.data.total_comments) {
                  console.log(`Syncing comment count with server: ${response.data.total_comments}`);
                  idea.total_comments = response.data.total_comments;
                }
              }
            },
            error: (error) => {
              console.error('Failed to sync comment count with server', error);
            }
          });
        }
      } else {
        console.log(`Idea ${event.ideaId} not found in current list`);
      }
    }
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

  // 添加编辑Idea方法
  editIdea(ideaId: string): void {
    this.router.navigate(['/submit-idea', ideaId]);
  }

  protected readonly Math = Math;
} 