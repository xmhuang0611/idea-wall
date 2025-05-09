import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { CardModule } from 'primeng/card';
import { TagService } from '../../services/tag.service';
import { IdeaService } from '../../services/idea.service';
import { Tag } from '../../models/tag.model';
import { AuthService } from '../../auth/auth.service';

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
    SliderModule,
    CardModule
  ],
  template: `
    <div class="surface-ground py-4 px-4 md:px-6 lg:px-8">
      <p-card [style]="{'max-width': '800px'}" class="mx-auto">
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
                     class="w-full">
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
                        class="w-full"></textarea>
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
                       styleClass="w-full"></p-dropdown>
            <small class="p-error block mt-1" *ngIf="ideaForm.get('category')?.invalid && ideaForm.get('category')?.touched">
              Please select a category
            </small>
          </div>

          <!-- Feeling -->
          <div class="field mb-4">
            <label for="feeling" class="block text-900 font-medium mb-2">Feeling Level</label>
            <div class="surface-50 p-3 border-round">
              <p-slider id="feeling"
                       formControlName="feeling"
                       [min]="1"
                       [max]="5"
                       [step]="1"
                       styleClass="w-full"></p-slider>
              <div class="flex justify-content-between text-sm text-600 mt-2">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            <small class="p-error block mt-1" *ngIf="ideaForm.get('feeling')?.invalid && ideaForm.get('feeling')?.touched">
              Please select a feeling level between 1 and 5
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
                          styleClass="w-full"
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
    
    :host ::ng-deep {
      .p-card {
        .p-card-body {
          padding: 1.5rem;
          width: 100%;
        }

        .p-card-content {
          padding: 0;
          width: 100%;
        }
      }
      
      .p-inputtext,
      .p-dropdown,
      .p-multiselect {
        width: 100%;
      }
      
      .p-dropdown-panel .p-dropdown-items,
      .p-multiselect-panel .p-multiselect-items {
        padding: 0.5rem 0;
      }
      
      .p-dropdown-item,
      .p-multiselect-item {
        padding: 0.75rem 1.25rem;
      }

      .p-slider {
        .p-slider-handle {
          transition: background-color 0.2s;
        }
      }
      
      @media screen and (max-width: 576px) {
        .p-card .p-card-body {
          padding: 1rem;
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
} 