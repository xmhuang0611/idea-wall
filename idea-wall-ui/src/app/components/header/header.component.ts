import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="surface-0 shadow-1 px-4 py-3 flex justify-content-between align-items-center">
      <div class="text-2xl font-bold">
        <a routerLink="/" class="text-900 no-underline">Idea Wall</a>
      </div>
      <nav>
        <ng-container *ngIf="!(authService.getCurrentUser() | async); else loggedIn">
          <button pButton routerLink="/login" label="登录" class="p-button-text"></button>
        </ng-container>
        <ng-template #loggedIn>
          <button pButton (click)="logout()" label="退出" class="p-button-text"></button>
        </ng-template>
      </nav>
    </header>
  `,
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule]
})
export class HeaderComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
} 