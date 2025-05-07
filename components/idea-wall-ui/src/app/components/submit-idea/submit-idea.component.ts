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
import { TagService } from '../../services/tag.service';
import { IdeaService } from '../../services/idea.service';
import { Tag } from '../../models/tag.model';

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
    SliderModule
  ],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto mt-8">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-gray-900">{{isEditMode ? 'Edit Idea' : 'Submit Your Idea'}}</h2>
        <p class="text-gray-600 mt-2">{{isEditMode ? 'Update your idea details' : 'Share your innovative ideas with the community'}}</p>
      </div>

      <form [formGroup]="ideaForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Title -->
        <div class="form-group">
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input pInputText
                 id="title"
                 formControlName="title"
                 placeholder="Enter a descriptive title"
                 class="w-full">
          <small class="text-red-500" *ngIf="ideaForm.get('title')?.invalid && ideaForm.get('title')?.touched">
            Title is required and must be at least 3 characters long
          </small>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea pInputTextarea
                    id="description"
                    formControlName="description"
                    [rows]="5"
                    [autoResize]="true"
                    placeholder="Describe your idea in detail"
                    class="w-full"></textarea>
          <small class="text-red-500" *ngIf="ideaForm.get('description')?.invalid && ideaForm.get('description')?.touched">
            Description is required and must be at least 10 characters long
          </small>
        </div>

        <!-- Category -->
        <div class="form-group">
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <p-dropdown id="category"
                     formControlName="category"
                     [options]="categories"
                     placeholder="Select a category"
                     styleClass="w-full"
                     [style]="{'width': '100%'}"></p-dropdown>
          <small class="text-red-500" *ngIf="ideaForm.get('category')?.invalid && ideaForm.get('category')?.touched">
            Please select a category
          </small>
        </div>

        <!-- Feeling -->
        <div class="form-group">
          <label for="feeling" class="block text-sm font-medium text-gray-700 mb-1">Feeling Level</label>
          <p-slider id="feeling"
                   formControlName="feeling"
                   [min]="1"
                   [max]="5"
                   [step]="1"
                   styleClass="w-full"></p-slider>
          <div class="flex justify-between text-sm text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <small class="text-red-500" *ngIf="ideaForm.get('feeling')?.invalid && ideaForm.get('feeling')?.touched">
            Please select a feeling level between 1 and 5
          </small>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <p-multiSelect id="tags"
                        formControlName="tags"
                        [options]="availableTags"
                        optionLabel="tag_name"
                        optionValue="tag_id"
                        [showToggleAll]="false"
                        placeholder="Select relevant tags"
                        styleClass="w-full"
                        [style]="{'width': '100%'}"
                        [maxSelectedLabels]="3"></p-multiSelect>
          <small class="text-gray-500">Select tags that best describe your idea (optional)</small>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4">
          <button pButton
                  type="button"
                  label="Cancel"
                  class="p-button-text"
                  (click)="onCancel()"></button>
          <button pButton
                  type="submit"
                  [label]="isEditMode ? 'Update Idea' : 'Submit Idea'"
                  [loading]="isSubmitting"
                  [disabled]="ideaForm.invalid || isSubmitting"></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1rem;
    }
    
    :host ::ng-deep {
      .p-inputtext,
      .p-dropdown,
      .p-multiselect {
        width: 100%;
      }
      
      .p-dropdown-panel .p-dropdown-items {
        padding: 0.5rem 0;
      }
      
      .p-multiselect-panel .p-multiselect-items {
        padding: 0.5rem 0;
      }
      
      .p-dropdown-item,
      .p-multiselect-item {
        padding: 0.5rem 1rem;
      }

      .p-slider {
        width: 100%;
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
    private ideaService: IdeaService
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