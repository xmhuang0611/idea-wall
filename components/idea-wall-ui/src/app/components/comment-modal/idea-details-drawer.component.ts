import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
    BadgeModule
  ],
  template: `
    <p-sidebar 
      [(visible)]="visible" 
      position="right" 
      [style]="{ width: '35rem' }"
      [baseZIndex]="10000"
      (onHide)="onSidebarHide()">
      <ng-template pTemplate="header">
        <div class="flex align-items-center">
          <h3 class="m-0">Idea Details</h3>
        </div>
      </ng-template>
      
      <div class="p-fluid p-3">
        <!-- Idea Details -->
        <div *ngIf="isLoading" class="flex justify-content-center p-5">
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
              <span *ngIf="comments.length > 0" class="text-sm font-normal text-500">({{comments.length}})</span>
            </h3>
            
            <div class="comment-input-container mb-4">
              <form [formGroup]="commentForm" (ngSubmit)="submitComment()">
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
                      type="submit"
                      label="Submit" 
                      icon="pi pi-send"
                      [disabled]="!commentForm.valid"
                      class="p-button-sm"
                      style="width: 80px;">
              </button>
            </div>
            
            <div *ngIf="commentsLoading" class="flex justify-content-center p-3">
              <i class="pi pi-spin pi-spinner text-xl"></i>
            </div>
            
            <div *ngIf="!commentsLoading && comments.length === 0" class="text-center p-3 surface-ground border-round">
              <i class="pi pi-comments text-xl mb-2 text-500"></i>
              <p class="m-0">No comments yet. Be the first to comment!</p>
            </div>
            
            <div *ngIf="!commentsLoading && comments.length > 0" class="comment-list">
              <div *ngFor="let comment of comments; let last = last" 
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
          </div>
        </div>
      </div>
    </p-sidebar>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .comment-list {
      max-height: 400px;
      overflow-y: auto;
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
    
    :host ::ng-deep .submit-button {
      border-radius: 4px;
      padding: 0.4rem 1rem;
      margin: 0 1rem 0.5rem 0;
      background-color: #0288d1;
      font-weight: 500;
      font-size: 0.875rem;
    }
    
    .submit-btn-container {
      text-align: right;
      margin-top: 0;
    }
    
    .idea-details {
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      padding-bottom: 3rem;
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
    }
    
    .submit-btn {
      border: 1px solid #1976d2;
      background-color: #1976d2;
      color: #fff;
      padding: 8px 24px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s, border 0.2s;
    }
    
    .submit-btn:hover {
      background-color: #1565c0;
      border-color: #1565c0;
    }
  `]
})
export class IdeaDetailsDrawerComponent implements OnInit, OnChanges {
  @Input() ideaId: string = '';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  
  idea: Idea | null = null;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isLoading: boolean = false;
  commentsLoading: boolean = false;
  isSubmitting: boolean = false;
  
  constructor(
    private ideaService: IdeaService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.loadIdeaDetails();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] && changes['visible'].currentValue) || 
        (changes['ideaId'] && this.visible)) {
      this.loadIdeaDetails();
    }
  }
  
  loadIdeaDetails(): void {
    if (!this.ideaId || !this.visible) return;
    
    this.isLoading = true;
    this.ideaService.getIdeaById(this.ideaId).subscribe({
      next: (response: any) => {
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
    this.ideaService.getComments(this.ideaId).subscribe({
      next: (response: any) => {
        if (response.data) {
          this.comments = response.data;
        } else {
          this.comments = [];
        }
        this.commentsLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load comments', error);
        this.comments = [];
        this.commentsLoading = false;
      }
    });
  }
  
  submitComment(): void {
    if (this.commentForm.invalid || this.isSubmitting) return;
    
    const commentText = this.commentForm.get('comment')?.value;
    this.isSubmitting = true;
    
    this.ideaService.addComment(this.ideaId, commentText).subscribe({
      next: (response) => {
        if (response.success) {
          this.commentForm.reset();
          this.loadComments();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Failed to post comment', error);
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