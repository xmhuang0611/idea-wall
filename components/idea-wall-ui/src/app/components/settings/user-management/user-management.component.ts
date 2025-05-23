import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-user-management',
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
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  displayModal = false;
  isEditing = false;
  userForm: FormGroup;
  selectedUser: User | null = null;
  loading = false;
  availableRoles: UserRole[] = [
    'ADMIN', 
    'IDEA_SESSION_PANEL_REVIEWER', 
    'IDEA_INCUBATOR_REVIEWER'
  ];
  
  roleDisplayMap: Record<UserRole, string> = {
    'ADMIN': 'Administrator',
    'IDEA_SESSION_PANEL_REVIEWER': 'Session Panel Reviewer',
    'IDEA_INCUBATOR_REVIEWER': 'Incubator Reviewer'
  };

  constructor(
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      user_id: ['', [Validators.required]],
      user_name: ['', [Validators.required]],
      roles: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
          this.filteredUsers = this.users.filter(
            user => user.roles && user.roles.length > 0
          );
        }
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  openUserModal(user?: User): void {
    this.isEditing = !!user;
    this.selectedUser = user ? { ...user } : null;
    this.userForm.reset({
      user_id: user?.user_id || '',
      user_name: user?.user_name || '',
      roles: user?.roles ? [...user.roles] : []
    });
    this.displayModal = true;
  }

  handleOk(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      
      if (!this.isEditing) {
        // Create user
        this.userService.createUser(formValue).subscribe({
          next: (response: ApiResponse<User>) => {
            if (response.success) {
              this.displayModal = false;
              this.fetchUsers();
            }
          }
        });
      } else if (this.selectedUser) {
        // Update user roles
        this.userService.updateUserRoles(
          this.selectedUser.user_id, 
          formValue.roles
        ).subscribe({
          next: (response: ApiResponse<User>) => {
            if (response.success) {
              this.displayModal = false;
              this.fetchUsers();
            }
          }
        });
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  handleCancel(): void {
    this.displayModal = false;
    this.userForm.reset();
    this.selectedUser = null;
  }

  isRoleSelected(role: UserRole): boolean {
    return this.userForm.get('roles')?.value?.includes(role) || false;
  }

  toggleRole(role: UserRole): void {
    const roles = [...(this.userForm.get('roles')?.value || [])];
    const index = roles.indexOf(role);
    if (index === -1) {
      roles.push(role);
    } else {
      roles.splice(index, 1);
    }
    this.userForm.patchValue({ roles });
  }

  formatRoles(roles: UserRole[]): string {
    return roles.map(role => this.roleDisplayMap[role]).join(', ');
  }

  confirmDeleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete user "${user.user_name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-rounded',
      rejectButtonStyleClass: 'p-button-secondary p-button-rounded',
      accept: () => {
        this.deleteUser(user);
      }
    });
  }

  deleteUser(user: User): void {
    this.userService.deleteUser(user.user_id, user.user_name).subscribe({
      next: (response: ApiResponse<boolean>) => {
        if (response.success) {
          this.fetchUsers();
        }
      }
    });
  }
} 