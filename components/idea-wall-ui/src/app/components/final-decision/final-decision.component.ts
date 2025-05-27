import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IdeaService } from '../../services/idea.service';
import { ReviewService } from '../../services/review.service';
import { Idea } from '../../models/idea.model';

@Component({
  selector: 'app-final-decision',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextareaModule,
    RadioButtonModule,
    ProgressSpinnerModule
  ],
  template: `
    <div class="final-decision-form">
      <!-- Header -->
      <div class="mb-4">
        <p class="m-0 text-sm text-500 mt-1">
          Review the evaluations and make a final decision for this idea.
        </p>
      </div>
      
      <form [formGroup]="decisionForm" (ngSubmit)="onSubmit()">
        <!-- Decision Options -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-3 text-700">Decision <span class="text-red-500">*</span></label>
          <div class="flex flex-column gap-3">
            <div class="flex align-items-center">
              <p-radioButton 
                inputId="approved" 
                name="decision" 
                value="APPROVED" 
                formControlName="decision">
              </p-radioButton>
              <label for="approved" class="ml-2 cursor-pointer">
                <span class="font-medium text-green-600">Approve</span>
                <span class="block text-sm text-500">
                  Approve for next stage (incubator)
                </span>
              </label>
            </div>
            
            <div class="flex align-items-center">
              <p-radioButton 
                inputId="rejected" 
                name="decision" 
                value="REJECTED" 
                formControlName="decision">
              </p-radioButton>
              <label for="rejected" class="ml-2 cursor-pointer">
                <span class="font-medium text-red-600">Reject</span>
                <span class="block text-sm text-500">
                  Reject the idea
                </span>
              </label>
            </div>
            
            <div class="flex align-items-center">
              <p-radioButton 
                inputId="improvement" 
                name="decision" 
                value="NEED_IMPROVEMENT" 
                formControlName="decision">
              </p-radioButton>
              <label for="improvement" class="ml-2 cursor-pointer">
                <span class="font-medium text-orange-600">Need Improvement</span>
                <span class="block text-sm text-500">
                  Request improvements from submitter
                </span>
              </label>
            </div>
          </div>
          
          <div 
            *ngIf="decisionForm.get('decision')?.invalid && decisionForm.get('decision')?.touched"
            class="text-red-500 text-sm mt-2">
            Please select a decision.
          </div>
        </div>

        <!-- Comments -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2 text-700">Comments</label>
          <textarea 
            pInputTextarea 
            formControlName="comments"
            rows="4" 
            placeholder="Provide detailed reasoning for your decision..."
            class="w-full">
          </textarea>
        </div>

        <!-- Review Summary -->
        <div class="mb-4 p-3 surface-100 border-round">
          <h4 class="m-0 mb-2 text-sm font-medium text-700">Review Summary</h4>
          <div class="grid">
            <div class="col-6">
              <span class="text-sm text-600">Total Reviews:</span>
              <span class="ml-2 font-medium text-700">{{ reviewCount }}</span>
            </div>
            <div class="col-6">
              <span class="text-sm text-600">Average Score:</span>
              <span class="ml-2 font-medium text-700">{{ averageScore | number:'1.1-1' }}/5</span>
            </div>
          </div>
          <div *ngIf="reviewCount < 2" class="text-orange-600 text-sm mt-2">
            <i class="pi pi-exclamation-triangle mr-1"></i>
            Minimum 2 reviews required for final decision.
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-content-end gap-2">
          <button 
            pButton 
            type="button" 
            label="Cancel" 
            class="p-button-outlined p-button-rounded"
            (click)="onCancel()">
          </button>
          <button 
            pButton 
            type="submit" 
            label="Submit Decision" 
            class="p-button-rounded"
            [loading]="isSubmitting"
            [disabled]="decisionForm.invalid || reviewCount < 2">
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./final-decision.component.scss']
})
export class FinalDecisionComponent {
  @Input() ideaId!: string;
  @Input() reviewCount = 0;
  @Input() averageScore = 0;
  @Output() decisionSubmitted = new EventEmitter<Idea>();
  @Output() cancelled = new EventEmitter<void>();

  decisionForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private ideaService: IdeaService,
    private reviewService: ReviewService
  ) {
    this.decisionForm = this.fb.group({
      decision: ['', Validators.required],
      comments: ['']
    });
  }

  onSubmit(): void {
    if (this.decisionForm.invalid || this.reviewCount < 2) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const { decision, comments } = this.decisionForm.value;

    this.reviewService.makeSessionFinalDecision(this.ideaId, decision, comments)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.decisionSubmitted.emit(response.data);
            this.resetForm();
          }
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error submitting decision:', error);
          this.isSubmitting = false;
        }
      });
  }

  onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.decisionForm.controls).forEach(key => {
      const control = this.decisionForm.get(key);
      if (control) {
        control.markAsDirty();
        control.markAsTouched();
      }
    });
  }

  private resetForm(): void {
    this.decisionForm.reset();
  }
} 