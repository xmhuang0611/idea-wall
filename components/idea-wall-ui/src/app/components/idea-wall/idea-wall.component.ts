import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IdeaService } from '../../services/idea.service';
import { Idea } from '../../models/idea.model';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { IdeaDetailsDrawerComponent } from '../idea-details/idea-details-drawer.component';

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
    IdeaDetailsDrawerComponent
  ],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <!-- Header with Tabs -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-1">
            <div class="flex rounded-lg bg-gray-100 p-1">
              <button *ngFor="let cat of categories"
                      (click)="onCategorySelect(cat)"
                      class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      [class.bg-blue-500]="selectedCategory === cat"
                      [class.shadow-sm]="selectedCategory === cat"
                      [class.text-white]="selectedCategory === cat"
                      [class.text-gray-900]="selectedCategory === cat"
                      [class.text-gray-600]="selectedCategory !== cat">
                {{cat}}
              </button>
            </div>
          </div>
          <button routerLink="/submit-idea"
                  class="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center">
            <span class="text-xl mr-2">+</span>
            Submit Your Idea
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div class="relative">
              <input type="text"
                     [(ngModel)]="searchQuery"
                     (input)="onSearch()"
                     placeholder="Search ideas..."
                     class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <span class="absolute right-3 top-2.5 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
            </div>
          </div>

          <!-- Sort -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select [(ngModel)]="sortBy"
                    (change)="onSortChange()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="created_at">Latest Created</option>
              <option value="total_votes">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Ideas List -->
      <div class="space-y-4">
        <div *ngFor="let idea of ideas"
             class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex">
            <!-- Vote Column -->
            <div class="flex flex-col items-center mr-6 w-16">
              <button (click)="onVote(idea)"
                      class="hover:text-blue-600 transition-colors duration-300 flex flex-col items-center"
                      title="{{idea.hasVoted ? 'Unvote' : 'Vote'}}">
                <i class="{{idea.hasVoted ? 'pi pi-thumbs-up-fill' : 'pi pi-thumbs-up'}} text-xl flex justify-content-center"
                   [class.text-blue-600]="idea.hasVoted" 
                   [class.text-gray-500]="!idea.hasVoted"
                   style="width: 24px; height: 24px; display: flex; align-items: center;"></i>
                <span class="text-lg font-semibold mt-1">{{idea.total_votes}}</span>
              </button>
            </div>

            <!-- Content Column -->
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600" 
                    (click)="openDetails(idea.id)">
                  {{idea.title}}
                </h3>
                <button pButton 
                        pRipple 
                        icon="pi pi-info-circle"
                        class="p-button-rounded p-button-text p-button-sm" 
                        (click)="openDetails(idea.id)">
                </button>
              </div>
              <p class="text-gray-600 mb-3 line-clamp-2">{{idea.description}}</p>
              
              <!-- Tags - Moved above the divider -->
              <div class="flex flex-wrap gap-2 mb-3">
                <p-tag *ngFor="let tag of idea.tag_details" 
                      [value]="tag.tag_name"
                      [severity]="getTagSeverity(tag.tag_name)">
                </p-tag>
              </div>
              
              <p-divider></p-divider>
              
              <div class="flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center">
                  <!-- 修改评论按钮，显示评论数量 -->
                  <button (click)="openDetails(idea.id)" 
                          class="inline-flex items-center text-gray-500 hover:text-gray-700">
                    <i class="pi pi-comment mr-1"></i>
                    <span>{{ idea.total_comments || 0 }}</span>
                  </button>
                </div>
                <div class="flex items-center space-x-2 text-gray-500">
                  <span>By {{idea.creator_name}}</span>
                  <span class="hidden sm:inline mx-1">•</span>
                  <span class="hidden sm:inline">{{idea.created_at | date:'medium'}}</span>
                  <span class="sm:hidden">{{idea.created_at | date:'short'}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-500">
            Show
            <select [(ngModel)]="pageSize"
                    (change)="onPageSizeChange()"
                    class="mx-2 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            items per page
          </div>
          <div class="text-sm text-gray-500">
            Showing {{(currentPage - 1) * pageSize + 1}} - {{Math.min(currentPage * pageSize, totalItems)}} of {{totalItems}} items
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button (click)="onPageChange(1)"
                  [disabled]="currentPage === 1"
                  class="px-3 py-1 border rounded-md text-sm"
                  [class.opacity-50]="currentPage === 1">
            First
          </button>
          <button (click)="onPageChange(currentPage - 1)"
                  [disabled]="currentPage === 1"
                  class="px-3 py-1 border rounded-md text-sm"
                  [class.opacity-50]="currentPage === 1">
            Previous
          </button>
          <div class="flex space-x-1">
            <ng-container *ngFor="let page of getPageNumbers()">
              <button *ngIf="page !== '...'"
                      (click)="onPageChange(+page)"
                      class="px-3 py-1 border rounded-md text-sm"
                      [class.bg-blue-500]="currentPage === +page"
                      [class.text-white]="currentPage === +page">
                {{page}}
              </button>
              <span *ngIf="page === '...'" class="px-2">...</span>
            </ng-container>
          </div>
          <button (click)="onPageChange(currentPage + 1)"
                  [disabled]="currentPage * pageSize >= totalItems"
                  class="px-3 py-1 border rounded-md text-sm"
                  [class.opacity-50]="currentPage * pageSize >= totalItems">
            Next
          </button>
          <button (click)="onPageChange(getTotalPages())"
                  [disabled]="currentPage === getTotalPages()"
                  class="px-3 py-1 border rounded-md text-sm"
                  [class.opacity-50]="currentPage === getTotalPages()">
            Last
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="ideas?.length === 0" 
           class="text-center py-12">
        <p class="text-gray-500">No ideas found matching your criteria.</p>
      </div>
    </div>
    
    <!-- Idea Details Drawer -->
    <app-idea-details-drawer
      [(visible)]="ideaDetailsVisible"
      [ideaId]="selectedIdeaId"
      (commentCountChange)="onCommentCountChange($event)">
    </app-idea-details-drawer>
  `,
  styles: [`
    :host {
      display: block;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  
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

  constructor(private ideaService: IdeaService) {}

  ngOnInit(): void {
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

  protected readonly Math = Math;
} 