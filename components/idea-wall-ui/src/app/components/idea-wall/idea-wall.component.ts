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
import { DialogModule } from 'primeng/dialog';
import { IdeaDetailsComponent } from '../idea-details/idea-details.component';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { TagService } from '../../services/tag.service';
import { TagUtilService, TagOption } from '../../shared/services/tag-util.service';
import { UserService } from '../../services/user.service';
import { UserRole } from '../../models/user.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { IdeaHistoryComponent } from '../idea-history/idea-history.component';
import { FeelingUtilService } from '../../shared/services/feeling-util.service';
import { ApiResponse } from '../../shared/models/api-response.model';
import { SessionReviewFormComponent } from '../session-review-form/session-review-form.component';

interface Topic {
  name: string;
  count: number;
}

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
    DialogModule,
    IdeaDetailsComponent,
    ConfirmDialogModule,
    IdeaHistoryComponent,
    SessionReviewFormComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './idea-wall.component.html',
  styleUrls: ['./idea-wall.component.scss']
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  currentUserId: string = '';
  isAdmin: boolean = false;
  showMyIdeas: boolean = false;
  showMyVoted: boolean = false;
  showMyBookmarked: boolean = false;
  
  // Search and filter conditions
  searchQuery = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Tag filter
  availableTags: TagOption[] = [];
  selectedTags: number[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50, 100];

  // Idea Details drawer
  ideaDetailsVisible = false;
  selectedIdeaId = '';

  // Store comment counts for each idea to update list display
  commentCounts: { [ideaId: string]: number } = {};

  isLoading = false;
  newestIdeasLoading = false;

  // Idea History dialog
  historyDialogVisible = false;
  historyIdeaId = '';

  hotTopics: Topic[] = [];
  newestIdeas: Idea[] = [];

  // Session Review
  sessionReviewDialogVisible = false;
  selectedSessionIdeaId: string | null = null;

  constructor(
    private ideaService: IdeaService,
    private router: Router,
    public authService: AuthService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private tagService: TagService,
    private tagUtilService: TagUtilService,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    public feelingUtil: FeelingUtilService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.currentUserId = this.authService.getId();
      this.checkAdminRole();
    }
    
    this.loadTags();
    this.loadIdeas();
    
    // Get idea ID from route params and open idea details drawer
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.openDetails(params['id']);
      }
    });
    
    // Check if current URL contains idea ID
    const currentPath = window.location.pathname;
    const ideaIdMatch = currentPath.match(/\/idea\/([^\/]+)/);
    if (ideaIdMatch && ideaIdMatch[1]) {
      this.openDetails(ideaIdMatch[1]);
    }

    this.loadHotTopics();
    this.loadNewestIdeas();
  }
  
  loadTags(): void {
    this.tagService.getTags().subscribe(response => {
      if (response.success && response.data) {
        this.availableTags = this.tagUtilService.formatTagsForDisplay(response.data, true);
      }
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

    if (this.showMyVoted) {
      params.voted_by = this.currentUserId;
    }

    if (this.showMyBookmarked) {
      params.bookmarked_by = this.currentUserId;
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
          } else {
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
    const voteStatus = idea.has_voted ? 0 : 1;
    
    this.ideaService.voteIdea(idea.id, voteStatus).subscribe({
      next: () => {
        // Update vote status
        idea.has_voted = !idea.has_voted;
        
        // Update vote count
        if (idea.has_voted) {
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

  /**
   * Open idea details drawer
   * @param ideaId 
   */
  openDetails(ideaId: string): void {
    this.selectedIdeaId = ideaId;
    this.ideaDetailsVisible = false;
    
    // Use history API to update URL to avoid page flicker
    window.history.replaceState({}, '', `/idea/${ideaId}`);
    
    // Get comments data directly
    this.ideaService.getComments(ideaId).subscribe({
      next: (commentsResponse) => {
        if (commentsResponse.success && Array.isArray(commentsResponse.data)) {
          const commentCount = commentsResponse.data.length;
          // Update comment count cache
          this.commentCounts[ideaId] = commentCount;
          
          // Update comment count in current list
          const idea = this.ideas.find(i => i.id === ideaId);
          if (idea && idea.total_comments !== commentCount) {
            idea.total_comments = commentCount;
          }
        }
        
        // Open details drawer
        setTimeout(() => {
          this.ideaDetailsVisible = true;
        }, 0);
      },
      error: () => {
        // Open details even if comments fetch fails
        setTimeout(() => {
          this.ideaDetailsVisible = true;
        }, 0);
      }
    });
  }

  /**
   * Handle comment count change event
   * @param event {ideaId: string, count: number} 
   */
  onCommentCountChange(event: {ideaId: string, count: number}): void {
    // Update comment count for specified idea
    const idea = this.ideas.find(i => i.id === event.ideaId);
    if (idea && idea.total_comments !== event.count) {
      idea.total_comments = event.count;
    }
  }

  /**
   * Handle vote status change event from idea-details component
   * @param event Event object containing ideaId, has_voted and totalVotes
   */
  onVoteStatusChange(event: {ideaId: string, has_voted: boolean, totalVotes: number}): void {
    // Update vote status and count for specified idea
    const idea = this.ideas.find(i => i.id === event.ideaId);
    if (idea) {
      idea.has_voted = event.has_voted;
      idea.total_votes = event.totalVotes;
    }
  }
  
  /**
   * Edit idea
   * @param ideaId 
   */
  editIdea(ideaId: string): void {
    this.router.navigate(['/idea-form', ideaId]);
  }

  onMyIdeasChange(checked: boolean): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onMyVotedChange(checked: boolean): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onMyBookmarkedChange(checked: boolean): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  /**
   * Share idea link
   * @param ideaId 
   */
  shareIdea(ideaId: string): void {
    // Build complete URL for the idea
    const baseUrl = window.location.origin;
    const ideaUrl = `${baseUrl}/idea/${ideaId}`;
    
    // Use Clipboard API to copy link
    navigator.clipboard.writeText(ideaUrl)
      .then(() => {
        this.toastService.showSuccess('Link copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        this.toastService.showError('Failed to copy link');
      });
  }

  /**
   * Handle bookmark/unbookmark operation
   * @param idea The idea to bookmark/unbookmark
   */
  onBookmark(idea: Idea): void {
    // Toggle bookmark status: if already bookmarked then unbookmark (0), otherwise bookmark (1)
    const bookmarkStatus = idea.has_bookmarked ? 0 : 1;
    
    this.ideaService.bookmarkIdea(idea.id, bookmarkStatus).subscribe({
      next: () => {
        // Update bookmark status
        idea.has_bookmarked = !idea.has_bookmarked;
        
        // Update bookmark count
        if (idea.has_bookmarked) {
          idea.total_bookmarks += 1;
        } else {
          idea.total_bookmarks -= 1;
        }
      },
      error: (error: any) => {
        console.error('Bookmark failed', error);
      }
    });
  }

  /**
   * Check if current user is admin
   */
  private checkAdminRole(): void {
    const userId = this.authService.getId();
    if (userId) {
      this.userService.getUser(userId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Check if user has ADMIN role
            this.isAdmin = response.data.roles.some(role => role === 'ADMIN');
          }
        },
        error: (error) => {
          console.error('Error checking admin role:', error);
          this.isAdmin = false;
        }
      });
    }
  }

  /**
   * Check if user has permission to edit the idea
   */
  canEditIdea(idea: Idea): boolean {
    return this.isAdmin || idea.creator_id === this.currentUserId;
  }

  onIdeaDeleted(ideaId: string): void {
    // Remove the deleted idea from the list
    this.ideas = this.ideas.filter(idea => idea.id !== ideaId);
    // Update total count
    this.totalItems--;
  }

  /**
   * Show confirmation dialog before deleting an idea
   * @param idea Idea to be deleted
   */
  confirmDelete(idea: Idea): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this idea? This action cannot be undone.',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-rounded',
      rejectButtonStyleClass: 'p-button-secondary p-button-rounded',
      accept: () => {
        this.deleteIdea(idea);
      }
    });
  }

  /**
   * Delete an idea
   * @param idea Idea to be deleted
   */
  deleteIdea(idea: Idea): void {
    this.ideaService.deleteIdea(idea.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove deleted idea from the list
          this.ideas = this.ideas.filter(i => i.id !== idea.id);
          // Update total count
          this.totalItems--;
        }
      },
      error: (error) => {
        console.error('Failed to delete idea:', error);
      }
    });

  }

  /**
   * View idea history
   * @param ideaId 
   */
  viewIdeaHistory(ideaId: string): void {
    this.historyIdeaId = ideaId;
    this.historyDialogVisible = true;
    // Stop event propagation to prevent opening details
    event?.stopPropagation();
  }

  private loadHotTopics() {
    // TODO: Implement hot topics fetching logic
    // Using mock data temporarily
    this.hotTopics = [
      { name: 'Product Improvement', count: 15 },
      { name: 'User Experience', count: 12 },
      { name: 'New Features', count: 10 },
      { name: 'Bug Fixes', count: 8 },
      { name: 'Performance Optimization', count: 6 }
    ];
  }

  private loadNewestIdeas(): void {
    this.newestIdeasLoading = true;
    this.ideaService.getIdeas({
      limit: 5,
      sort_by: 'created_at',
      sort_order: 'desc'
    }).subscribe({
      next: (response: ApiResponse<Idea[]>) => {
        if (response.success && response.data) {
          this.newestIdeas = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading newest ideas:', error);
      },
      complete: () => {
        this.newestIdeasLoading = false;
      }
    });
  }

  onTopicClick(topic: Topic) {
    // When clicking a topic, filter the ideas list by matching tags
    const matchingTags = this.availableTags.filter(tag => 
      tag.label.toLowerCase().includes(topic.name.toLowerCase())
    );
    this.selectedTags = matchingTags.map(tag => tag.tag_id);
    this.onTagFilterChange();
  }

  onIdeaClick(ideaId: string) {
    this.openDetails(ideaId);
  }

  /**
   * Navigate to session review page for an idea
   */
  navigateToSessionReview(ideaId: string): void {
    this.router.navigate(['/session-review', ideaId]);
  }
} 