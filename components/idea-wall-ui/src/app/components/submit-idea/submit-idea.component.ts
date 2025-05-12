import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { TagService } from '../../services/tag.service';
import { IdeaService } from '../../services/idea.service';
import { Tag } from '../../models/tag.model';
import { AuthService } from '../../auth/auth.service';

interface FeelingOption {
  value: number;
  label: string;
  image: string;
}

@Component({
  selector: 'app-submit-idea',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    MultiSelectModule,
    CardModule
  ],
  template: `
    <div class="surface-ground py-2 px-4 md:px-6 lg:px-8 flex justify-content-center w-full">
      <p-card [style]="{'width': '100%'}" class="mx-auto submit-idea-card">
        <ng-template pTemplate="header">
          <div class="bg-primary-50 p-4 border-round-top">
            <h2 class="text-2xl font-semibold text-900 m-0">
              {{isEditMode ? 'Edit Idea' : 'Submit Your Idea'}}
            </h2>
            <p class="text-600 mt-2 mb-0">
              {{isEditMode ? 'Update your idea details' : 'Share your innovative ideas with the community'}}
            </p>
          </div>
        </ng-template>

        <form [formGroup]="ideaForm" (ngSubmit)="onSubmit()" class="flex flex-column w-full">
          <!-- Title -->
          <div class="field mb-4">
            <label for="title" class="block text-900 font-medium mb-2">Title</label>
            <div class="p-input-filled">
              <input pInputText
                     id="title"
                     formControlName="title"
                     placeholder="Enter a descriptive title"
                     class="w-full submit-idea-input">
            </div>
            <small class="p-error block mt-1" *ngIf="ideaForm.get('title')?.invalid && ideaForm.get('title')?.touched">
              Title is required and must be at least 3 characters long
            </small>
          </div>

          <!-- Description -->
          <div class="field mb-4">
            <label for="description" class="block text-900 font-medium mb-2">Description</label>
            <div class="p-input-filled">
              <textarea pInputTextarea
                        id="description"
                        formControlName="description"
                        [rows]="5"
                        [autoResize]="true"
                        placeholder="Describe your idea in detail"
                        class="w-full submit-idea-input"></textarea>
            </div>
            <small class="p-error block mt-1" *ngIf="ideaForm.get('description')?.invalid && ideaForm.get('description')?.touched">
              Description is required and must be at least 10 characters long
            </small>
          </div>

          <!-- Category -->
          <div class="field mb-4">
            <label for="category" class="block text-900 font-medium mb-2">Category</label>
            <p-dropdown id="category"
                       formControlName="category"
                       [options]="categories"
                       placeholder="Select a category"
                       [style]="{'width': '100%'}"
                       styleClass="w-full submit-idea-dropdown-panel">
            </p-dropdown>
            <small class="p-error block mt-1" *ngIf="ideaForm.get('category')?.invalid && ideaForm.get('category')?.touched">
              Please select a category
            </small>
          </div>

          <!-- Feeling -->
          <div class="field mb-4">
            <label class="block text-900 font-medium mb-2">How do you feel about this idea?</label>
            <div class="feeling-selector surface-ground p-3 border-round">
              <div class="flex justify-content-between align-items-center">
                <div *ngFor="let option of feelingOptions" 
                     class="feeling-option flex flex-column align-items-center cursor-pointer"
                     [class.selected]="ideaForm.get('feeling')?.value === option.value"
                     (click)="selectFeeling(option.value)">
                  <div class="feeling-image-container mb-2">
                    <img [src]="option.image" 
                         [alt]="option.label"
                         class="feeling-image"
                         [class.selected]="ideaForm.get('feeling')?.value === option.value">
                  </div>
                  <span class="feeling-label text-sm text-600"
                        [class.selected]="ideaForm.get('feeling')?.value === option.value">
                    {{option.label}}
                  </span>
                </div>
              </div>
            </div>
            <small class="p-error block mt-1" *ngIf="ideaForm.get('feeling')?.invalid && ideaForm.get('feeling')?.touched">
              Please select a feeling level
            </small>
          </div>

          <!-- Tags -->
          <div class="field mb-4">
            <label for="tags" class="block text-900 font-medium mb-2">Tags</label>
            <p-multiSelect id="tags"
                          formControlName="tags"
                          [options]="availableTags"
                          optionLabel="tag_name"
                          optionValue="tag_id"
                          [showToggleAll]="false"
                          placeholder="Select relevant tags"
                          [style]="{'width': '100%'}"
                          styleClass="w-full submit-idea-input"
                          [maxSelectedLabels]="3"></p-multiSelect>
            <small class="text-600 block mt-1">Select tags that best describe your idea (optional)</small>
          </div>

          <!-- Actions -->
          <div class="flex justify-content-end gap-2 pt-3">
            <button pButton
                    type="button"
                    label="Cancel"
                    class="p-button-outlined"
                    (click)="onCancel()"></button>
            <button pButton
                    type="submit"
                    [label]="isEditMode ? 'Update Idea' : 'Submit Idea'"
                    [loading]="isSubmitting"
                    [disabled]="ideaForm.invalid || isSubmitting || !authService.isLoggedIn()"
                    class="p-button-primary"></button>
          </div>
        </form>
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .submit-idea-card {
      width: 1600px !important;

      .p-card-body {
        padding: 2rem;
        width: 100%;
      }

      .p-card-content {
        padding: 0;
        width: 100%;
      }
    }
    
    .submit-idea-input {
      width: 100%;
    }
    
    .submit-idea-dropdown-panel {
      .p-dropdown-items,
      .p-multiselect-items {
        padding: 0.5rem 0;
      }
      
      .p-dropdown-item,
      .p-multiselect-item {
        padding: 0.75rem 1.25rem;
      }
    }

    .feeling-selector {
      .feeling-option {
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: var(--surface-hover);
        }
        
        &.selected {
          background-color: var(--primary-100);
        }
      }
      
      .feeling-image-container {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .feeling-image {
        width: 48px;
        height: 48px;
        transition: all 0.2s ease;
        
        &.selected {
          width: 56px;
          height: 56px;
          transform: scale(1.15);
        }
      }

      .feeling-label {
        transition: all 0.2s ease;
        font-size: 0.875rem;
        
        &.selected {
          font-size: 1rem;
          font-weight: 600;
          color: var(--primary-700);
        }
      }
    }
    
    @media screen and (max-width: 576px) {
      .submit-idea-card .p-card-body {
        padding: 1rem;
      }
      
      .feeling-selector {
        .feeling-image-container {
          width: 48px;
          height: 48px;
        }
        
        .feeling-image {
          width: 40px;
          height: 40px;
          
          &.selected {
            width: 48px;
            height: 48px;
          }
        }

        .feeling-label {
          font-size: 0.75rem;
          
          &.selected {
            font-size: 0.875rem;
          }
        }
      }
    }
  `]
})
export class SubmitIdeaComponent implements OnInit {
  ideaForm: FormGroup;
  isSubmitting = false;
  categories = ['Idea', 'Pain', 'Thought'];
  availableTags: Tag[] = [];
  isEditMode = false;
  ideaId: string | null = null;

  feelingOptions: FeelingOption[] = [
    { value: 1, label: 'Unhappy', image: 'assets/images/1-1f92c.png' },
    { value: 2, label: 'Terrible', image: 'assets/images/2-1f621.png' },
    { value: 3, label: 'Thoughtable', image: 'assets/images/3-1f615.png' },
    { value: 4, label: 'Happy', image: 'assets/images/4-1f604.png' },
    { value: 5, label: 'Unbelievable', image: 'assets/images/5-1f929.png' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private tagService: TagService,
    private ideaService: IdeaService,
    public authService: AuthService
  ) {
    this.ideaForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      feeling: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      tags: [[]]
    });
  }

  ngOnInit(): void {
    // 检查用户是否已登录
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadTags();
    
    // 检查是否是编辑模式
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.ideaId = params['id'];
        this.loadIdea(this.ideaId);
      }
    });
  }

  loadTags(): void {
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = tags;
      },
      error: (error) => {
        console.error('Failed to load tags:', error);
      }
    });
  }

  loadIdea(ideaId: string | null): void {
    if (!ideaId) {
      console.error('Invalid idea ID');
      this.router.navigate(['/']);
      return;
    }

    this.ideaService.getIdeaById(ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const idea = response.data;
          console.log('Loaded idea:', idea);
          this.ideaForm.patchValue({
            title: idea.title,
            description: idea.description,
            category: idea.category,
            feeling: Number(idea.feeling),
            tags: idea.tags || []
          });
        }
      },
      error: (error) => {
        console.error('Failed to load idea:', error);
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit(): void {
    if (this.ideaForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.ideaForm.value;

    // 准备提交的数据
    const ideaData = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      feeling: Number(formValue.feeling),
      tags: formValue.tags || []
    };

    if (this.isEditMode && this.ideaId) {
      // 更新现有Idea
      this.ideaService.updateIdea(this.ideaId, ideaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/']);
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // 创建新Idea
      this.ideaService.createIdea(ideaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/']);
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  selectFeeling(value: number): void {
    this.ideaForm.patchValue({ feeling: value });
  }
} 