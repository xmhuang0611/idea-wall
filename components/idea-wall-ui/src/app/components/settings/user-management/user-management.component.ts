import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ApiResponse } from '../../../shared/models/api-response.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <h2>User Management</h2>
      <table class="user-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>User Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>{{ user.user_name }}</td>
            <td>{{ formatRoles(user.roles) }}</td>
            <td>
              <button class="edit-btn" (click)="openEditModal(user)">Edit</button>
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
          <button class="cancel-btn" (click)="closeModal()">Cancel</button>
          <button class="save-btn" (click)="saveRole()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;

      th, td {
        padding: 14px 18px;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
      }

      th {
        background: #f3f4f6;
        font-weight: 600;
      }
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
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  selectedUser: User | null = null;
  selectedRoles: UserRole[] = [];
  availableRoles: UserRole[] = ['ADMIN', 'IDEA_SESSION_PANEL_REVIEWER', 'IDEA_INCUBATOR_REVIEWER'];
  
  roleDisplayMap: Record<UserRole, string> = {
    'ADMIN': 'Administrator',
    'IDEA_SESSION_PANEL_REVIEWER': 'Session Panel Reviewer',
    'IDEA_INCUBATOR_REVIEWER': 'Incubator Reviewer'
  };

  constructor(
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
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
} 