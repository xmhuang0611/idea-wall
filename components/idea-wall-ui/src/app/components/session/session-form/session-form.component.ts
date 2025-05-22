import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CardModule } from 'primeng/card';
import { ToastService } from '../../../shared/services/toast.service';
import { SessionService } from '../../../services/session.service';
import { IdeaService } from '../../../services/idea.service';
import { Idea } from '../../../models/idea.model';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { BasicInfo } from '../../../models/session.model';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CardModule,
    DividerModule,
    TooltipModule
  ],
  template: `
    <div class="container">
      <!-- Original Idea Preview Card -->
      <div *ngIf="idea" class="surface-card p-3 shadow-2 border-round mt-4 mb-4">
        <div class="flex justify-content-between align-items-center mb-2">
          <div class="text-900 font-semibold text-lg">Original Idea</div>
          <button 
            pButton 
            type="button" 
            icon="pi pi-external-link" 
            label="View Details" 
            class="p-button-text p-button-rounded p-button-sm"
            (click)="viewIdeaDetails(idea.id)"
          ></button>
        </div>
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="text-600 mb-1">Title</div>
            <div class="text-900 mb-3">{{idea.title}}</div>
          </div>
          <div class="col-12 md:col-6">
            <div class="text-600 mb-1">Created By</div>
            <div class="text-900 mb-3">{{idea.creator_name}}</div>
          </div>
          <div class="col-12">
            <div class="text-600 mb-1">Description</div>
            <div class="text-900 mb-3 description-preview">{{idea.description}}</div>
          </div>
        </div>
      </div>
      
      <!-- Session Form Card -->
      <div class="surface-card p-4 shadow-2 border-round mt-3">
        <div class="text-900 font-semibold text-xl mb-3">{{isEditMode ? 'Edit' : 'Create'}} Idea Review Session</div>
        
        <form [formGroup]="sessionForm" (ngSubmit)="onSubmit()">
          <div class="p-fluid p-formgrid grid">
            <div class="col-12">
              <p-divider>
                <span class="font-medium text-900">Basic Information</span>
              </p-divider>
            </div>

            <div class="field col-12 mb-2">
              <label for="title" class="font-medium text-900 mb-2">Session Title</label>
              <input 
                id="title" 
                type="text" 
                pInputText 
                formControlName="title"
                [class.ng-dirty]="sessionForm.get('title')?.invalid && sessionForm.get('title')?.touched"
              />
              <small 
                *ngIf="sessionForm.get('title')?.invalid && sessionForm.get('title')?.touched"
                class="p-error"
              >
                Title is required
              </small>
            </div>

            <div class="field col-6 mb-2">
              <label for="submitterJob" class="font-medium text-900 mb-2">Your Job Title</label>
              <input 
                id="submitterJob" 
                type="text" 
                pInputText 
                formControlName="submitter_job"
                placeholder="Your current job title"
              />
            </div>

            <div class="field col-6 mb-2">
              <label for="manager" class="font-medium text-900 mb-2">Manager</label>
              <input 
                id="manager" 
                type="text" 
                pInputText 
                formControlName="manager"
                placeholder="Your manager's name"
              />
            </div>
            
            <div class="field col-6 mb-2">
              <label for="stream" class="font-medium text-900 mb-2">Stream</label>
              <input 
                id="stream" 
                type="text" 
                pInputText 
                formControlName="stream"
                placeholder="Your department or stream"
              />
            </div>

            <div class="field col-6 mb-2">
              <label for="clients" class="font-medium text-900 mb-2">Clients</label>
              <input 
                id="clients" 
                type="text" 
                pInputText 
                formControlName="clients"
                placeholder="Related clients or stakeholders"
              />
            </div>

            <div class="col-12">
              <p-divider>
                <span class="font-medium text-900">Proposal Details</span>
              </p-divider>
            </div>
            
            <div class="field col-12 mb-2">
              <label for="problemStatements" class="font-medium text-900 mb-2">Problem Statements</label>
              <textarea 
                id="problemStatements" 
                pInputTextarea 
                formControlName="problem_statements"
                [rows]="4" 
                [autoResize]="true"
                placeholder="Describe the problems this idea addresses"
                [class.ng-dirty]="sessionForm.get('problem_statements')?.invalid && sessionForm.get('problem_statements')?.touched"
              ></textarea>
              <small 
                *ngIf="sessionForm.get('problem_statements')?.invalid && sessionForm.get('problem_statements')?.touched"
                class="p-error"
              >
                Problem statements are required
              </small>
            </div>
            
            <div class="field col-12 mb-2">
              <label for="solutions" class="font-medium text-900 mb-2">Solutions</label>
              <textarea 
                id="solutions" 
                pInputTextarea 
                formControlName="solutions"
                [rows]="4" 
                [autoResize]="true"
                placeholder="Describe your proposed solutions"
                [class.ng-dirty]="sessionForm.get('solutions')?.invalid && sessionForm.get('solutions')?.touched"
              ></textarea>
              <small 
                *ngIf="sessionForm.get('solutions')?.invalid && sessionForm.get('solutions')?.touched"
                class="p-error"
              >
                Solutions are required
              </small>
            </div>
            
            <div class="field col-12 mb-2">
              <label for="value" class="font-medium text-900 mb-2">Value Proposition</label>
              <textarea 
                id="value" 
                pInputTextarea 
                formControlName="value"
                [rows]="4" 
                [autoResize]="true"
                placeholder="Describe the value this idea brings"
                [class.ng-dirty]="sessionForm.get('value')?.invalid && sessionForm.get('value')?.touched"
              ></textarea>
              <small 
                *ngIf="sessionForm.get('value')?.invalid && sessionForm.get('value')?.touched"
                class="p-error"
              >
                Value proposition is required
              </small>
            </div>
            
            <div class="col-12 mt-2">
              <div class="flex justify-content-end gap-2">
                <button 
                  pButton 
                  type="button" 
                  label="Cancel" 
                  class="p-button-outlined p-button-rounded"
                  (click)="cancel()"
                ></button>
                <button 
                  pButton 
                  type="submit" 
                  label="Submit" 
                  class="p-button-primary p-button-rounded"
                  [disabled]="sessionForm.invalid || submitting"
                  [loading]="submitting"
                ></button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-inputtext {
        width: 100%;
      }
      
      .p-card {
        margin-bottom: 1rem;
      }

      .field {
        margin-bottom: 0.5rem;
      }

      .p-inputgroup-addon {
        background-color: var(--primary-color);
        color: var(--primary-color-text);
        border-color: var(--primary-color);
      }

      .description-preview {
        max-height: 100px;
        overflow-y: auto;
        white-space: pre-line;
      }
    }
  `]
})
export class SessionFormComponent implements OnInit {
  sessionForm: FormGroup;
  submitting: boolean = false;
  isEditMode: boolean = false;
  ideaId: string | null = null;
  idea: Idea | null = null;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private sessionService: SessionService,
    private ideaService: IdeaService
  ) {
    this.sessionForm = this.fb.group({
      title: ['', Validators.required],
      problem_statements: ['', Validators.required],
      solutions: ['', Validators.required],
      value: ['', Validators.required],
      submitter_job: [''],
      manager: [''],
      stream: [''],
      clients: ['']
    });
  }
  
  ngOnInit(): void {
    // Check if it's create mode or edit mode
    this.route.paramMap.subscribe(params => {
      const sessionId = params.get('id');
      
      if (sessionId) {
        // Edit existing session
        this.isEditMode = true;
        this.loadSessionDetails(sessionId);
      } else {
        // Create new session
        // Get idea info from query params
        this.route.queryParamMap.subscribe(qParams => {
          this.ideaId = qParams.get('idea_id');
          const ideaTitle = qParams.get('ideaTitle');
          
          if (this.ideaId) {
            // Get idea details from API
            this.loadIdeaDetails(this.ideaId);
          }
          
          // Prefill title field if available
          if (ideaTitle) {
            this.sessionForm.patchValue({
              title: ideaTitle
            });
          }
        });
      }
    });
  }
  
  loadSessionDetails(sessionId: string): void {
    this.sessionService.getSessionById(sessionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const session = response.data;
          this.ideaId = session.idea_id;
          
          // Load the associated idea details
          if (this.ideaId) {
            this.loadIdeaDetails(this.ideaId);
          }
          
          // Fill form with session data
          this.sessionForm.patchValue({
            title: session.title,
            problem_statements: session.problem_statements,
            solutions: session.solutions,
            value: session.value,
            submitter_job: session.basic_info?.submitter_job || '',
            manager: session.basic_info?.manager || '',
            stream: session.basic_info?.stream || '',
            clients: session.basic_info?.clients || ''
          });
        } else {
          this.toastService.showError('Failed to load session details');
          this.router.navigate(['/sessions']);
        }
      },
      error: (error) => {
        console.error('Error loading session', error);
        this.toastService.showError('Failed to load session details');
        this.router.navigate(['/sessions']);
      }
    });
  }
  
  loadIdeaDetails(ideaId: string): void {
    this.ideaService.getIdeaById(ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.idea = response.data;
          
          // If title is empty, fill with idea title
          if (!this.sessionForm.get('title')?.value) {
            this.sessionForm.patchValue({
              title: this.idea.title
            });
          }

          // If problem statements is empty, prefill with idea description
          if (!this.sessionForm.get('problem_statements')?.value && this.idea.description) {
            this.sessionForm.patchValue({
              problem_statements: this.idea.description
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading idea details', error);
      }
    });
  }
  
  onSubmit(): void {
    if (this.sessionForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.sessionForm.controls).forEach(key => {
        const control = this.sessionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    if (!this.ideaId) {
      this.toastService.showError('Missing idea ID');
      return;
    }
    
    this.submitting = true;
    const formData = this.sessionForm.value;
    
    if (this.isEditMode) {
      // Update existing session
      const sessionId = this.route.snapshot.paramMap.get('id');
      if (!sessionId) {
        this.toastService.showError('Missing session ID');
        this.submitting = false;
        return;
      }
      
      this.sessionService.updateSession(sessionId, formData).subscribe({
        next: (response) => {
          this.submitting = false;
          if (response.success) {
            this.toastService.showSuccess('Session updated successfully');
            this.router.navigate(['/sessions', sessionId]);
          } else {
            this.toastService.showError('Failed to update session');
          }
        },
        error: (error) => {
          this.submitting = false;
          console.error('Error updating session', error);
          this.toastService.showError('Failed to update session');
        }
      });
    } else {
      // Create new session
      this.sessionService.createSession(this.ideaId, formData).subscribe({
        next: (response) => {
          this.submitting = false;
          if (response.success && response.data) {
            this.toastService.showSuccess('Session created successfully');
            this.router.navigate(['/sessions', response.data.id]);
          } else {
            this.toastService.showError('Failed to create session');
          }
        },
        error: (error) => {
          this.submitting = false;
          console.error('Error creating session', error);
          this.toastService.showError('Failed to create session');
        }
      });
    }
  }
  
  cancel(): void {
    if (this.isEditMode) {
      const sessionId = this.route.snapshot.paramMap.get('id');
      this.router.navigate(['/sessions', sessionId]);
    } else {
      this.router.navigate(['/sessions']);
    }
  }

  viewIdeaDetails(ideaId: string): void {
    // Navigate to idea details page
    this.router.navigate(['/idea', ideaId]);
  }
} 