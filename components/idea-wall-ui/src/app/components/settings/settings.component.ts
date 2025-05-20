import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsMenuComponent, SettingsMenu } from './settings-menu/settings-menu.component';
import { UserManagementComponent } from './user-management/user-management.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SettingsMenuComponent, UserManagementComponent],
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
          
          <!-- Tags Management will be added here -->
          <div *ngIf="selectedMenu === 'tags-management'" class="coming-soon">
            <h2>Tags Management</h2>
            <p>Coming soon...</p>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .settings-outer {
      min-height: calc(100vh - 152px);
      background: #f4f7fa;
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

    .settings-content {
      flex: 1;
      padding: 40px 36px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      min-height: 500px;
    }

    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
      
      h2 {
        margin-bottom: 1rem;
        color: #374151;
      }
      
      p {
        font-size: 1.1rem;
      }
    }
  `]
})
export class SettingsComponent {
  selectedMenu: SettingsMenu = 'user-management';

  onMenuSelect(menu: SettingsMenu): void {
    this.selectedMenu = menu;
  }
} 