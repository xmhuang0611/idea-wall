import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { TagManagementComponent } from './tag-management/tag-management.component';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserManagementComponent,
    TagManagementComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  menuItems: MenuItem[] = [
    {
      label: 'User Management',
      icon: 'pi pi-users',
      routerLink: '/settings/users'
    },
    {
      label: 'Tag Management',
      icon: 'pi pi-tags',
      routerLink: '/settings/tags'
    }
  ];
} 