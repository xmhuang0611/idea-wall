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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { FeelingUtilService } from '../../shared/services/feeling-util.service';

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
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './idea-details.component.html',
  styleUrls: ['./idea-details.component.scss']
})
export class IdeaDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ideaId: string = '';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() commentCountChange = new EventEmitter<{ideaId: string, count: number}>();
  @Output() voteStatusChange = new EventEmitter<{ideaId: string, has_voted: boolean, totalVotes: number}>();
  @Output() ideaDeleted = new EventEmitter<string>();
  
  idea: Idea | null = null;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isLoading: boolean = false;
  commentsLoading: boolean = false;
  isSubmitting: boolean = false;
  commentPageSize: number = 5;
  displayedComments: Comment[] = [];
  sidebarWidth: string = '50vw';
  isAdmin: boolean = false;
  
  constructor(
    private ideaService: IdeaService,
    private fb: FormBuilder,
    private router: Router,
    private confirmationService: ConfirmationService,
    private toastService: ToastService,
    private authService: AuthService,
    private userService: UserService,
    public feelingUtil: FeelingUtilService,
  ) {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
    this.setResponsiveWidth();
  }
  
  ngOnInit(): void {
    this.loadIdeaDetails();
    // Listen for window size changes
    window.addEventListener('resize', this.onResize.bind(this));
    // Check admin role if user is logged in
    if (this.authService.isLoggedIn()) {
      this.checkAdminRole();
    }
  }
  
  ngOnDestroy(): void {
    // Clean up event listeners
    window.removeEventListener('resize', this.onResize.bind(this));
  }
  
  // Adjust drawer width based on screen size
  onResize(): void {
    this.setResponsiveWidth();
  }
  
  // Set responsive width based on screen width
  setResponsiveWidth(): void {
    const screenWidth = window.innerWidth;
    
    if (screenWidth < 768) {
      // Use larger proportion on mobile devices
      this.sidebarWidth = '85vw';
    } else if (screenWidth < 1200) {
      // Use medium proportion on tablets
      this.sidebarWidth = '65vw';
    } else {
      // Use half width on desktop
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
            
            // Update comment count and notify parent component
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
  
  // Update currently displayed comments
  private updateDisplayedComments(): void {
    // Show first page by default
    this.displayedComments = this.comments.slice(0, this.commentPageSize);
  }
  
  // Handle pagination changes
  onCommentPageChange(event: any): void {
    const pageIndex = event.page;
    const pageSize = event.rows;
    this.commentPageSize = pageSize;
    
    // Calculate comments for current page
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
            // Reset form
            this.commentForm.reset();
            
            // Reload comments
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
    // Use history API to modify URL directly to avoid page flicker
    window.history.replaceState({}, '', '/');
  }
  
  /**
   * Handle vote/unvote operation
   */
  onVote(): void {
    if (!this.idea) {
      return;
    }
    
    // Toggle vote status: if already voted then unvote (0), otherwise vote (1)
    const voteStatus = this.idea.has_voted ? 0 : 1;
    
    this.ideaService.voteIdea(this.idea.id, voteStatus).subscribe({
      next: () => {
        // Update vote status
        if (this.idea) {
          this.idea.has_voted = !this.idea.has_voted;
          
          // Update vote count
          if (this.idea.has_voted) {
            this.idea.total_votes += 1;
          } else {
            this.idea.total_votes -= 1;
          }
          
          // Notify parent component of vote status change
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
  
  /**
   * Handle bookmark/unbookmark operation
   */
  onBookmark(): void {
    if (!this.idea) {
      return;
    }
    
    // Toggle bookmark status: if already bookmarked then unbookmark (0), otherwise bookmark (1)
    const bookmarkStatus = this.idea.has_bookmarked ? 0 : 1;
    
    this.ideaService.bookmarkIdea(this.idea.id, bookmarkStatus).subscribe({
      next: () => {
        // Update bookmark status
        if (this.idea) {
          this.idea.has_bookmarked = !this.idea.has_bookmarked;
          
          // Update bookmark count
          if (this.idea.has_bookmarked) {
            this.idea.total_bookmarks += 1;
          } else {
            this.idea.total_bookmarks -= 1;
          }
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

  canDeleteIdea(): boolean {
    if (!this.idea || !this.authService.isLoggedIn()) {
      return false;
    }
    const currentUserId = this.authService.getId();
    return this.isAdmin || this.idea.creator_id === currentUserId;
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this idea? This action cannot be undone.',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-rounded',
      rejectButtonStyleClass: 'p-button-rounded',
      accept: () => {
        this.deleteIdea();
      }
    });
  }

  deleteIdea(): void {
    if (!this.idea) return;

    this.ideaService.deleteIdea(this.idea.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Idea deleted successfully');
          this.ideaDeleted.emit(this.idea?.id);
          this.visibleChange.emit(false);
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Failed to delete idea', error);
        this.toastService.showError('Failed to delete idea');
      }
    });
  }
}