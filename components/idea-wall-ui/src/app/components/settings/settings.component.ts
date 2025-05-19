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
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  users: User[] = [];
  selectedMenu = 'user-management';
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