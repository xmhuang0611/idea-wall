import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { Idea } from '../../models/idea.model';
import { IdeaService } from '../../services/idea.service';

@Component({
  selector: 'app-idea-card',
  template: `
    <p-card [header]="idea.title" styleClass="h-full">
      <ng-template pTemplate="header">
        <div class="flex align-items-center justify-content-between p-2">
          <span class="p-tag">{{ idea.category }}</span>
          <span class="text-sm text-500">{{ idea.created_at | date }}</span>
        </div>
      </ng-template>

      <p>{{ idea.description }}</p>

      <div class="flex gap-2">
        <p-chip *ngFor="let tag of idea.tags" [label]="tag"></p-chip>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-content-between">
          <button 
            pButton 
            [label]="idea.total_votes.toString()"
            icon="pi pi-thumbs-up" 
            (click)="onVote()"
            [class.p-button-outlined]="!hasVoted"
          ></button>

          <button 
            pButton 
            icon="pi pi-comment" 
            (click)="showCommentDialog()"
            class="p-button-secondary"
          ></button>
        </div>
      </ng-template>
    </p-card>

    <p-dialog 
      [(visible)]="displayCommentDialog" 
      header="评论" 
      [modal]="true"
      [style]="{width: '50vw'}"
    >
      <div class="p-fluid">
        <div class="field">
          <textarea 
            pInputTextarea 
            [(ngModel)]="newComment" 
            rows="3" 
            placeholder="写下你的评论..."
          ></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button 
          pButton 
          label="提交" 
          (click)="submitComment()"
          [disabled]="!newComment.trim()"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChipModule,
    DialogModule,
    FormsModule
  ]
})
export class IdeaCardComponent {
  @Input() idea!: Idea;
  displayCommentDialog = false;
  newComment = '';
  hasVoted = false;

  constructor(private ideaService: IdeaService) {}

  onVote() {
    this.ideaService.voteIdea(this.idea._id, this.hasVoted ? 0 : 1).subscribe({
      next: (response) => {
        this.hasVoted = !this.hasVoted;
        this.idea.total_votes += this.hasVoted ? 1 : -1;
      },
      error: (error) => {
        console.error('投票失败', error);
      }
    });
  }

  showCommentDialog() {
    this.displayCommentDialog = true;
  }

  submitComment() {
    if (this.newComment.trim()) {
      this.ideaService.addComment(this.idea._id, this.newComment).subscribe({
        next: (response) => {
          this.displayCommentDialog = false;
          this.newComment = '';
        },
        error: (error) => {
          console.error('评论失败', error);
        }
      });
    }
  }
} 