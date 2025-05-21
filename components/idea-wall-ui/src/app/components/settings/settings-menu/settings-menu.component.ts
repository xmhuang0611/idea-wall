import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SettingsMenu = 'user-management' | 'tag-management';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="settings-menu">
      <ul>
        <li 
          *ngFor="let item of menuItems" 
          [class.active]="selectedMenu === item.id"
          (click)="onMenuSelect(item.id)">
          {{ item.label }}
        </li>
      </ul>
    </aside>
  `,
  styles: [`
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

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        padding: 18px 36px;
        cursor: pointer;
        color: #374151;
        font-weight: 500;
        border-left: 4px solid transparent;
        border-radius: 8px;
        margin: 0 12px;
        transition: background 0.2s, border-color 0.2s, color 0.2s;

        &.active, &:hover {
          background: #f3f4f6;
          border-left: 4px solid #3b82f6;
          color: #1d4ed8;
        }
      }
    }
  `]
})
export class SettingsMenuComponent {
  @Input() selectedMenu: SettingsMenu = 'user-management';
  @Output() menuSelect = new EventEmitter<SettingsMenu>();

  menuItems = [
    { id: 'user-management' as SettingsMenu, label: 'User Management' },
    { id: 'tag-management' as SettingsMenu, label: 'Tag Management' }
  ];

  onMenuSelect(menu: SettingsMenu): void {
    this.menuSelect.emit(menu);
  }
} 