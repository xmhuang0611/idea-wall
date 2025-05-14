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
import { TagUtilService, TagOption } from '../../shared/services/tag-util.service';

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
  templateUrl: './submit-idea.component.html',
  styleUrls: ['./submit-idea.component.scss']
})
export class SubmitIdeaComponent implements OnInit {
  ideaForm: FormGroup;
  isSubmitting = false;
  availableTags: Tag[] = [];
  formattedTags: TagOption[] = [];
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
    public authService: AuthService,
    private tagUtilService: TagUtilService
  ) {
    this.ideaForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      feeling: [null, Validators.required],
      tags: [[]]
    });
  }

  ngOnInit(): void {
    // 先加载标签数据，然后再加载idea数据
    this.loadTags().then(() => {
      // Check if we're in edit mode
      this.route.paramMap.subscribe(params => {
        this.ideaId = params.get('id');
        if (this.ideaId) {
          this.isEditMode = true;
          this.loadIdea(this.ideaId);
        }
      });
    });
  }

  loadTags(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.tagService.getTags().subscribe(tags => {
        this.availableTags = tags;
        this.formattedTags = this.tagUtilService.formatTagsForDisplay(tags, true);
        resolve();
      }, error => {
        console.error('Error loading tags:', error);
        resolve(); // 即使出错也继续
      });
    });
  }

  loadIdea(ideaId: string | null): void {
    if (!ideaId) return;
    
    this.ideaService.getIdeaById(ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const idea = response.data;
          console.log('Loaded idea data:', idea);
          
          // 正确提取标签ID
          let tagIds: number[] = [];
          tagIds = idea.tags;
          
          // Update form with idea data
          this.ideaForm.patchValue({
            title: idea.title,
            description: idea.description,
            feeling: idea.feeling,
            tags: tagIds
          });
        } else {
          console.error('Failed to load idea:', response.error);
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Error loading idea:', error);
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit(): void {
    if (this.ideaForm.invalid || !this.authService.isLoggedIn()) {
      return;
    }
    
    this.isSubmitting = true;
    const formData = this.ideaForm.value;
    
    // Create payload - tags are already tag_ids as specified by optionValue in the template
    const payload = {
      title: formData.title,
      description: formData.description,
      feeling: formData.feeling,
      tags: formData.tags
    };
    
    // Decide whether to create or update
    const request = this.isEditMode && this.ideaId
      ? this.ideaService.updateIdea(this.ideaId, payload)
      : this.ideaService.createIdea(payload);
    
    request.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          console.error('Failed to submit idea:', response.error);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting idea:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  selectFeeling(value: number): void {
    this.ideaForm.patchValue({ feeling: value });
  }
} 