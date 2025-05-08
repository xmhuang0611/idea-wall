import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { ApiResponse } from '../../shared/models/api-response.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="settings-outer">
      <div class="settings-container">
        <aside class="settings-menu">
          <ul>
            <li [class.active]="selectedMenu === 'user-management'" (click)="selectMenu('user-management')">
              User Management
            </li>
          </ul>
        </aside>
        <main class="settings-content">
          <section *ngIf="selectedMenu === 'user-management'">
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
        </main>
      </div>
    </div>

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
                  type="radio"
                  [id]="role"
                  name="userRole"
                  [value]="role"
                  [checked]="selectedRole === role"
                  (change)="selectRole(role)"
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
    .settings-outer {
      min-height: 100vh;
      background: #f4f7fa;
      padding: 40px 0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .settings-container {
      display: flex;
      max-width: 1100px;
      width: 100%;
      gap: 32px;
      background: transparent;
      box-shadow: none;
    }
    .settings-menu {
      width: 240px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      padding: 36px 0;
      margin-top: 0;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-height: 500px;
    }
    .settings-menu ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .settings-menu li {
      padding: 18px 36px;
      cursor: pointer;
      color: #374151;
      font-weight: 500;
      border-left: 4px solid transparent;
      border-radius: 8px;
      margin: 0 12px;
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
    .settings-menu li.active, .settings-menu li:hover {
      background: #f3f4f6;
      border-left: 4px solid #3b82f6;
      color: #1d4ed8;
    }
    .settings-content {
      flex: 1;
      padding: 40px 36px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      min-height: 500px;
    }
    .user-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
    }
    .user-table th, .user-table td {
      padding: 14px 18px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    .user-table th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .edit-btn {
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .edit-btn:hover {
      background: #2563eb;
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
    }
    .modal h3 {
      margin: 0 0 24px 0;
      color: #1f2937;
    }
    .modal-content {
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #4b5563;
      font-weight: 500;
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
    }
    .role-option input[type="radio"] {
      width: 16px;
      height: 16px;
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
    }
    .cancel-btn:hover {
      background: #e5e7eb;
    }
    .save-btn {
      background: #3b82f6;
      border: none;
      color: white;
    }
    .save-btn:hover {
      background: #2563eb;
    }
  `]
})
export class SettingsComponent implements OnInit {
  users: User[] = [];
  selectedMenu = 'user-management';
  showModal = false;
  selectedUser: User | null = null;
  selectedRole: UserRole | null = null;
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

  selectMenu(menu: string): void {
    this.selectedMenu = menu;
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
    this.selectedRole = user.roles[0] || null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    this.selectedRole = null;
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
  }

  saveRole(): void {
    if (!this.selectedUser || !this.selectedRole) return;

    this.userService.updateUserRoles(this.selectedUser.user_id, [this.selectedRole])
      .subscribe({
        next: (response: ApiResponse<User>) => {
          if (response.success) {
            this.toastService.showSuccess('User role updated successfully');
            this.fetchUsers();
            this.closeModal();
          }
        },
        error: (error: Error) => {
          this.toastService.showError('Failed to update user role');
        }
      });
  }

  formatRoles(roles: UserRole[]): string {
    return roles.map(role => this.roleDisplayMap[role]).join(', ');
  }
} 