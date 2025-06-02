import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemConfigService, SystemConfig } from '../../../services/system-config.service';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    DialogModule,
    TableModule,
    ProgressSpinnerModule
  ],
  templateUrl: './config.component.html'
})
export class ConfigComponent implements OnInit {
  configs: SystemConfig[] = [];
  filteredConfigs: SystemConfig[] = [];
  displayModal = false;
  isEditing = false;
  configForm: FormGroup;
  selectedConfig: SystemConfig | null = null;
  loading = false;
  isSubmitting = false;

  constructor(
    private configService: SystemConfigService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) {
    this.configForm = this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      description: ['', [Validators.required]],
      value: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.fetchConfigs();
  }

  fetchConfigs(): void {
    this.loading = true;
    this.configService.getConfigs().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.configs = response.data;
          this.filteredConfigs = [...this.configs];
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  openConfigModal(config?: SystemConfig): void {
    this.isEditing = !!config;
    this.selectedConfig = config ? { ...config } : null;
    this.configForm.reset({
      key: config?.key || '',
      description: config?.description || '',
      value: config?.value || ''
    });
    if (this.isEditing) {
      this.configForm.get('key')?.disable();
    }
    this.displayModal = true;
  }

  handleOk(): void {
    if (this.configForm.valid) {
      this.isSubmitting = true;
      const formValue = this.configForm.value;
      
      this.configForm.disable();
      
      if (!this.isEditing) {
        // Create config
        this.configService.createConfig(formValue).subscribe({
          next: (response: ApiResponse<SystemConfig>) => {
            if (response.success) {
              this.displayModal = false;
              this.fetchConfigs();
            }
            this.resetSubmitState();
          },
          error: () => {
            this.resetSubmitState();
          }
        });
      } else if (this.selectedConfig) {
        // Update config
        this.configService.updateConfig(
          this.selectedConfig.key,
          { value: formValue.value }
        ).subscribe({
          next: (response: ApiResponse<SystemConfig>) => {
            if (response.success) {
              this.displayModal = false;
              this.fetchConfigs();
            }
            this.resetSubmitState();
          },
          error: () => {
            this.resetSubmitState();
          }
        });
      }
    } else {
      this.configForm.markAllAsTouched();
    }
  }

  private resetSubmitState(): void {
    this.isSubmitting = false;
    this.configForm.enable();
  }

  handleCancel(): void {
    this.displayModal = false;
    this.configForm.reset();
    this.resetSubmitState();
  }

  confirmDeleteConfig(config: SystemConfig): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete configuration "${config.key}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-rounded',
      rejectButtonStyleClass: 'p-button-secondary p-button-rounded',
      accept: () => {
        this.isSubmitting = true;
        this.configService.deleteConfig(config.key).subscribe({
          next: (response) => {
            if (response.success) {
              this.fetchConfigs();
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.isSubmitting = false;
          }
        });
      }
    });
  }

  clear(table: any): void {
    table.clear();
  }
} 