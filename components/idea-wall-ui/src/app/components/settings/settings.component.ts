import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsMenuComponent, SettingsMenu } from './settings-menu/settings-menu.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { TagManagementComponent } from './tag-management/tag-management.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    SettingsMenuComponent, 
    UserManagementComponent,
    TagManagementComponent
  ],
  template: `
    <div class="settings-outer">
      <div class="settings-container">
        <app-settings-menu
          [selectedMenu]="selectedMenu"
          (menuSelect)="onMenuSelect($event)">
        </app-settings-menu>
        
        <main class="settings-content">
          <app-user-management *ngIf="selectedMenu === 'user-management'">
          </app-user-management>
          
          <app-tag-management *ngIf="selectedMenu === 'tag-management'">
          </app-tag-management>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  selectedMenu: SettingsMenu = 'user-management';

  onMenuSelect(menu: SettingsMenu): void {
    this.selectedMenu = menu;
  }
} 