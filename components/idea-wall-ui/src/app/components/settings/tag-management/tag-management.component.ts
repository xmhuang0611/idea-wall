import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tag } from '../../../models/tag.model';
import { TagService } from '../../../services/tag.service';
import { ApiResponse } from '../../../shared/models/api-response.model';

@Component({
  selector: 'app-tag-management',
  templateUrl: './tag-management.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class TagManagementComponent implements OnInit {
  tags: Tag[] = [];
  parentTags: Tag[] = [];
  displayModal = false;
  isEditing = false;
  tagForm: FormGroup;
  expandedRowKeys: { [key: number]: boolean } = {};

  readonly defaultParentTag: Tag = {
    tag_id: 0,
    tag_name: 'Parent Tag',
    parent_id: 0,
    created_at: new Date(),
    creator_id: '',
    creator_name: '',
    updated_at: new Date(),
    updater_id: '',
    updater_name: '',
    children: []
  };

  constructor(
    private tagService: TagService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {
    this.tagForm = this.fb.group({
      tag_id: [null],
      tag_name: ['', [Validators.required]],
      parent_id: [0, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.fetchTags();
  }

  fetchTags(): void {
    this.tagService.getTagsWithHierarchy().subscribe({
      next: (response: ApiResponse<Tag[]>) => {
        if (response.success && response.data) {
          this.tags = response.data;
          this.parentTags = [this.defaultParentTag, ...this.tags.filter(tag => tag.parent_id === 0)];
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.error?.message || 'Failed to fetch tags'
          });
        }
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch tags'
        });
        console.error('Error fetching tags:', error);
      }
    });
  }

  openTagModal(tag?: Tag): void {
    this.isEditing = !!tag;
    this.tagForm.reset({
      tag_id: tag?.tag_id || null,
      tag_name: tag?.tag_name || '',
      parent_id: tag?.parent_id || 0
    });
    this.displayModal = true;
  }

  handleOk(): void {
    if (this.tagForm.valid) {
      const formValue = this.tagForm.value;
      const tagId = formValue.tag_id || 0;
      
      // Craete Tag
      if (!this.isEditing) {
        const tag: Partial<Tag> = {
          tag_id: tagId,
          tag_name: formValue.tag_name,
          parent_id: formValue.parent_id
        };
        
        this.tagService.createTag(tag).subscribe({
          next: (response: ApiResponse<Tag>) => {
            if (response.success) {
              this.displayModal = false;
              this.fetchTags();
            }
          },
          error: (error) => {
            console.error('Error creating tag:', error);
          }
        });
      } 
      // Updagte Tag
      else {
        const tag: Partial<Tag> = {
          tag_id: tagId,
          tag_name: formValue.tag_name,
          parent_id: formValue.parent_id
        };
        
        this.tagService.updateTag(tagId, tag).subscribe({
          next: (response: ApiResponse<Tag>) => {
            if (response.success) {
              this.displayModal = false;
              this.fetchTags();
            }
          },
          error: (error) => {
            console.error('Error updating tag:', error);
          }
        });
      }
    } else {
      this.tagForm.markAllAsTouched();
    }
  }

  handleCancel(): void {
    this.displayModal = false;
    this.tagForm.reset();
  }

  deleteTag(tag: Tag): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the tag "${tag.tag_name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-rounded',
      rejectButtonStyleClass: 'p-button-secondary p-button-rounded',
      accept: () => {
        this.tagService.deleteTag(tag.tag_id).subscribe({
          next: (response: ApiResponse<boolean>) => {
            if (response.success) {
              this.fetchTags();
            }
          },
          error: (error) => {
            console.error('Error deleting tag:', error);
          }
        });
      }
    });
  }

  onRowExpand(event: { data: Tag }): void {
    this.expandedRowKeys[event.data.tag_id] = true;
  }

  onRowCollapse(event: { data: Tag }): void {
    delete this.expandedRowKeys[event.data.tag_id];
  }
} 