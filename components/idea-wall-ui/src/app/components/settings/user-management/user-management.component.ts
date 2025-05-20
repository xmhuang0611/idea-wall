import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, ConfirmDialogModule],
  template: `
    <section>
      <div class="flex justify-content-between align-items-center mb-3">
        <h2 class="m-0">User Management</h2>
        <button pButton pRipple label="Add" icon="pi pi-plus" class="p-button-rounded p-button-primary" (click)="openCreateModal()"></button>
      </div>
      <table class="user-table">
        <thead>
          <tr>
            <th class="name-column">User Name</th>
            <th class="id-column">User ID</th>
            <th class="role-column">User Role</th>
            <th class="action-column">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of filteredUsers">
            <td>{{ user.user_name }}</td>
            <td>{{ user.user_id }}</td>
            <td>{{ formatRoles(user.roles) }}</td>
            <td class="action-buttons">
              <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-primary p-button-sm mr-2" (click)="openEditModal(user)"></button>
              <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-secondary p-button-sm" (click)="confirmDeleteUser(user)"></button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Role Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Edit User Roles</h3>
        <div class="modal-content">
          <div class="form-group">
            <label>Select Roles:</label>
            <div class="role-options">
              <div *ngFor="let role of availableRoles" class="role-option">
                <input
                  type="checkbox"
                  [id]="role"
                  [checked]="isRoleSelected(role)"
                  (change)="toggleRole(role)"
                >
                <label [for]="role">{{ roleDisplayMap[role] }}</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button pButton pRipple label="Cancel" icon="pi pi-times" class="p-button-rounded p-button-outlined p-button-secondary" (click)="closeModal()"></button>
          <button pButton pRipple label="Save" icon="pi pi-check" class="p-button-rounded p-button-primary" (click)="saveRole()"></button>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div class="modal-backdrop" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Create New User</h3>
        <div class="modal-content">
          <div class="form-group">
            <label for="userName">User Name: <span class="required-field">*</span></label>
            <input type="text" id="userName" class="form-control" [(ngModel)]="newUser.user_name" pInputText>
          </div>
          <div class="form-group">
            <label for="userId">User ID: <span class="required-field">*</span></label>
            <input type="text" id="userId" class="form-control" [(ngModel)]="newUser.user_id" pInputText>
          </div>
          <div class="form-group">
            <label>Select Roles: <span class="required-field">*</span></label>
            <div class="role-options">
              <div *ngFor="let role of availableRoles" class="role-option">
                <input
                  type="checkbox"
                  [id]="'new-'+role"
                  [checked]="isNewRoleSelected(role)"
                  (change)="toggleNewRole(role)"
                >
                <label [for]="'new-'+role">{{ roleDisplayMap[role] }}</label>
              </div>
            </div>
            <small *ngIf="newUser.roles.length === 0" class="validation-message">At least one role must be selected</small>
          </div>
        </div>
        <div class="modal-actions">
          <button pButton pRipple label="Cancel" icon="pi pi-times" class="p-button-rounded p-button-outlined p-button-secondary" (click)="closeCreateModal()"></button>
          <button pButton pRipple label="Create" icon="pi pi-check" class="p-button-rounded p-button-primary" (click)="createUser()" [disabled]="!isCreateFormValid()"></button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
  `,
  styles: [`
    .user-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      th, td {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: middle;
      }

      th {
        background: #f3f4f6;
        font-weight: 600;
        font-size: 0.9rem;
      }

      td {
        font-size: 0.9rem;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background-color: #f9fafb;
      }

      .name-column {
        width: 30%;
      }

      .id-column {
        width: 25%;
      }

      .role-column {
        width: 30%;
      }

      .action-column {
        width: 15%;
        text-align: center;
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .edit-btn {
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #2563eb;
      }
    }

    .modal-backdrop {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      min-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);

      h3 {
        margin: 0 0 24px 0;
        color: #1f2937;
      }
    }

    .modal-content {
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 8px;
        color: #4b5563;
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
      }
    }

    .role-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .role-option {
      display: flex;
      align-items: center;
      gap: 8px;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #3b82f6;
      }

      label {
        cursor: pointer;
        user-select: none;
        margin: 0;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .cancel-btn, .save-btn {
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .cancel-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      color: #4b5563;

      &:hover {
        background: #e5e7eb;
      }
    }

    .save-btn {
      background: #3b82f6;
      border: none;
      color: white;

      &:hover {
        background: #2563eb;
      }
    }

    .required-field {
      color: var(--red-500);
      margin-left: 4px;
    }

    .validation-message {
      color: var(--red-500);
      font-size: 0.875rem;
      margin-top: 4px;
      display: block;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  showModal = false;
  selectedUser: User | null = null;
  selectedRoles: UserRole[] = [];
  availableRoles: UserRole[] = ['ADMIN', 'IDEA_SESSION_PANEL_REVIEWER', 'IDEA_INCUBATOR_REVIEWER'];
  
  // Create user state
  showCreateModal = false;
  newUser: { user_id: string; user_name: string; roles: UserRole[] } = {
    user_id: '',
    user_name: '',
    roles: []
  };
  
  roleDisplayMap: Record<UserRole, string> = {
    'ADMIN': 'Administrator',
    'IDEA_SESSION_PANEL_REVIEWER': 'Session Panel Reviewer',
    'IDEA_INCUBATOR_REVIEWER': 'Incubator Reviewer'
  };

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
          // Filter users with roles
          this.filteredUsers = this.users.filter(user => user.roles && user.roles.length > 0);
        }
      },
      error: (error) => {
        this.toastService.showError('Failed to fetch users');
      }
    });
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.selectedRoles = [...user.roles];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    this.selectedRoles = [];
  }

  isRoleSelected(role: UserRole): boolean {
    return this.selectedRoles.includes(role);
  }

  toggleRole(role: UserRole): void {
    const index = this.selectedRoles.indexOf(role);
    if (index === -1) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles.splice(index, 1);
    }
  }

  saveRole(): void {
    if (!this.selectedUser) return;

    this.userService.updateUserRoles(this.selectedUser.user_id, this.selectedRoles)
      .subscribe({
        next: (response: ApiResponse<User>) => {
          if (response.success) {
            this.toastService.showSuccess(
              this.selectedRoles.length > 0 
                ? 'User roles updated successfully' 
                : 'All user roles have been removed'
            );
            this.fetchUsers();
            this.closeModal();
          }
        },
        error: (error: Error) => {
          this.toastService.showError('Failed to update user roles');
        }
      });
  }

  formatRoles(roles: UserRole[]): string {
    return roles.map(role => this.roleDisplayMap[role]).join(', ');
  }

  // Create user methods
  openCreateModal(): void {
    this.newUser = {
      user_id: '',
      user_name: '',
      roles: []
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newUser = {
      user_id: '',
      user_name: '',
      roles: []
    };
  }

  isNewRoleSelected(role: UserRole): boolean {
    return this.newUser.roles.includes(role);
  }

  toggleNewRole(role: UserRole): void {
    const index = this.newUser.roles.indexOf(role);
    if (index === -1) {
      this.newUser.roles.push(role);
    } else {
      this.newUser.roles.splice(index, 1);
    }
  }

  createUser(): void {
    // Form is already validated through the disabled button
    this.userService.createUser(this.newUser)
      .subscribe({
        next: (response: ApiResponse<User>) => {
          if (response.success) {
            this.toastService.showSuccess('User created successfully');
            this.fetchUsers();
            this.closeCreateModal();
          } else if (response.error) {
            // Handle specific error messages from the server
            this.toastService.showError(response.error.message || 'Failed to create user');
          }
        },
        error: (error: any) => {
          if (error.error?.error?.message) {
            // Extract error message from API response if available
            this.toastService.showError(error.error.error.message);
          } else if (error.status === 409) {
            this.toastService.showError(`User ID '${this.newUser.user_id}' already exists`);
          } else {
            this.toastService.showError('Failed to create user. Please try again.');
          }
        }
      });
  }

  isCreateFormValid(): boolean {
    return !!(this.newUser.user_id && 
             this.newUser.user_name && 
             this.newUser.roles.length > 0);
  }

  // Delete user methods
  confirmDeleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete user "${user.user_name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteUser(user);
      }
    });
  }

  deleteUser(user: User): void {
    this.userService.deleteUser(user.user_id)
      .subscribe({
        next: (response: ApiResponse<boolean>) => {
          if (response.success) {
            this.toastService.showSuccess(`User "${user.user_name}" deleted successfully`);
            this.fetchUsers();
          } else if (response.error) {
            this.toastService.showError(response.error.message || 'Failed to delete user');
          }
        },
        error: (error: any) => {
          if (error.error?.error?.message) {
            this.toastService.showError(error.error.error.message);
          } else {
            this.toastService.showError('Failed to delete user. Please try again.');
          }
        }
      });
  }
} 