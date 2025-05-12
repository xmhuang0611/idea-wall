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
import { PaginatorModule } from 'primeng/paginator';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    PaginatorModule,
    InputSwitchModule,
    ProgressSpinnerModule,
    IdeaDetailsDrawerComponent
  ],
  template: `
    <p-card class="mb-5 idea-wall-card">
      <!-- Submit Button -->
      <div class="flex justify-content-between gap-2 mb-4 align-items-center">
        <div class="flex align-items-center">
          <span class="text-base font-medium text-primary">My Ideas</span>
          <p-inputSwitch [(ngModel)]="showMyIdeas"
                        [disabled]="!authService.isLoggedIn()"
                        (ngModelChange)="onMyIdeasChange($event)"
                        class="ml-2">
          </p-inputSwitch>
        </div>
        <button pButton
                pRipple
                icon="pi pi-plus"
                label="Submit Your Idea"
                routerLink="/submit-idea"
                [disabled]="!authService.isLoggedIn()"
                class="p-button-rounded ml-4"
                (click)="!authService.isLoggedIn() && $event.preventDefault()">
        </button>
      </div>

      <!-- Filters Row -->
      <div class="flex gap-4 mb-5">
        <!-- Search -->
        <div class="flex-2">
          <label class="block mb-1">Search</label>
          <div class="p-inputgroup">
            <input type="text"
                   pInputText
                   [(ngModel)]="searchQuery"
                   (input)="onSearch()"
                   placeholder="Search ideas..."
                   class="w-full">
            <span class="p-inputgroup-addon">
              <i class="pi pi-search"></i>
            </span>
          </div>
        </div>

        <!-- Sort -->
        <div class="flex-1">
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

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-content-center align-items-center py-5">
        <p-progressSpinner 
          [style]="{width: '50px', height: '50px'}" 
          strokeWidth="4"
          fill="var(--surface-ground)" 
          animationDuration=".5s">
        </p-progressSpinner>
      </div>

      <!-- Ideas List -->
      <div *ngIf="!isLoading" class="ideas-container">
        <p-card *ngFor="let idea of ideas"
             class="idea-card"
             (click)="openDetails(idea.id)">
          <div class="flex">
            <!-- Vote Column -->
            <div class="flex flex-column align-items-center mr-3" style="width: 80px">
              <button pButton
                      pRipple
                      (click)="$event.stopPropagation(); onVote(idea)"
                      class="p-button-rounded p-button-text"
                      [class.p-button-secondary]="!idea.hasVoted"
                      [class.p-button-primary]="idea.hasVoted"
                      icon="pi pi-thumbs-up-fill"
                      title="{{idea.hasVoted ? 'Unvote' : 'Vote'}}">
              </button>
              <span class="mt-1 font-bold">{{idea.total_votes}}</span>
            </div>

            <!-- Content Column -->
            <div class="flex-1">
              <div class="flex justify-content-between align-items-center mb-2">
                <div class="flex align-items-center gap-2">
                  <div class="feeling-image-container">
                    <img [src]="getFeelingImage(idea.feeling)"
                         [alt]="getFeelingLabel(idea.feeling)"
                         class="feeling-image"
                         [title]="getFeelingLabel(idea.feeling)">
                  </div>
                  <h3 class="text-primary m-0">
                    {{idea.title}}
                  </h3>
                </div>
                <button *ngIf="idea.creator_id === currentUserId"
                        pButton
                        icon="pi pi-pencil"
                        class="p-button-rounded p-button-text p-button-sm"
                        (click)="$event.stopPropagation(); editIdea(idea.id)"
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
                          (click)="$event.stopPropagation(); openDetails(idea.id)" 
                          label="{{ idea.total_comments || 0 }}"
                          class="p-button-text p-button-sm">
                  </button>
                </div>
                <div class="flex align-items-center gap-2">
                  <span class="creator-name font-bold">{{idea.creator_name}}</span>
                  <span class="hidden sm:inline text-600">{{idea.created_at | date:'MMM d, y h:mm a'}}</span>
                  <span class="sm:hidden text-600">{{idea.created_at | date:'short'}}</span>
                </div>
              </div>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Pagination -->
      <div *ngIf="!isLoading" class="mt-4">
        <p-paginator
          [rows]="pageSize"
          [totalRecords]="totalItems"
          [rowsPerPageOptions]="pageSizeOptions"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}-{last} of {totalRecords}"
          [first]="(currentPage - 1) * pageSize"
          styleClass="border-none"
          (onPageChange)="onPageChange($event)">
        </p-paginator>
      </div>
    </p-card>

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
    
    .idea-wall-card {
      .flex-2 {
        flex: 2;
      }

      .p-card-body {
        padding: 2rem;
        width: 100%;
      }

      .p-card-content {
        padding: 0;
        width: 100%;
      }
    }

    .idea-wall-dropdown {
      width: 100%;
      
      .p-dropdown-label {
        padding-right: 2.5rem;
      }
    }

    .ideas-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-height: 200px;
    }

    .idea-card {
      .p-card-body {
        padding: 1.5rem;
      }
    }
    
    .idea-wall-paginator {
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

    .idea-wall-selectbutton {
      .p-button {
        padding: 0.5rem 1rem;
        
        &.p-highlight {
          background: var(--primary-color);
          border-color: var(--primary-color);
        }
      }
    }

    .idea-wall-inputswitch {
      .p-inputswitch-slider {
        background: var(--surface-200);
      }
      
      &.p-inputswitch-checked {
        .p-inputswitch-slider {
          background: var(--primary-color);
        }
      }

      &.ml-2 {
        margin-left: 0.5rem;
      }
    }

    .creator-name {
      font-size: 0.875rem;
    }

    .text-500 {
      color: var(--text-color-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .text-600 {
      color: var(--text-color);
      font-size: 0.875rem;
    }
    
    .idea-title {
      color: var(--primary-color);
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .idea-card {
      transition: all 0.2s ease;
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    }

    .feeling-image-container {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
    }
    
    .feeling-image {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    @media screen and (max-width: 576px) {
      .idea-wall-card .p-card-body {
        padding: 1rem;
      }
      
      .idea-card .p-card-body {
        padding: 1rem;
      }
      
      .ideas-container {
        gap: 1rem;
      }

      .feeling-image-container {
        width: 28px;
        height: 28px;
      }
      
      .feeling-image {
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  currentUserId: string = '';
  showMyIdeas: boolean = false;
  
  // Search and filter conditions
  searchQuery = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

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
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.currentUserId = this.authService.getId();
    }
    this.loadIdeas();
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

  protected readonly Math = Math;
} 