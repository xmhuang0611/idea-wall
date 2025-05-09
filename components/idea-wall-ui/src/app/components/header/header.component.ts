import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, OverlayPanelModule, ButtonModule],
  template: `
    <header class="bg-white border-1 border-300">
      <div class="container mx-auto px-4">
        <nav class="h-12 flex align-items-center justify-content-between">
          <!-- Left Side -->
          <div class="flex align-items-center gap-6">
            <a routerLink="/" class="text-primary hover:text-primary-600 no-underline">
              Idea Wall
            </a>
            <a routerLink="/" class="text-600 hover:text-primary no-underline">HomeIdeas</a>
            <a routerLink="/useful-links" class="text-600 hover:text-primary no-underline">Useful Links</a>
            <a routerLink="/about" class="text-600 hover:text-primary no-underline">About</a>
          </div>

          <!-- Right Side -->
          <div class="flex align-items-center">
            <button *ngIf="!isLoggedIn" 
                    (click)="login()"
                    pButton
                    label="Login"
                    class="p-button-primary">
            </button>
            
            <!-- User Avatar with Dropdown -->
            <div *ngIf="isLoggedIn" class="user-avatar">
              <div class="avatar-circle" (click)="op.toggle($event)">
                {{ getUserInitials() }}
              </div>
              
              <p-overlayPanel #op [showCloseIcon]="false" styleClass="user-dropdown">
                <div class="user-dropdown-content">
                  <div class="user-info">
                    <span class="user-name">{{ userName }}</span>
                  </div>
                  <div class="dropdown-divider"></div>
                  <button class="logout-button" (click)="logout()">
                    <i class="pi pi-sign-out logout-icon"></i>
                    Logout
                  </button>
                </div>
              </p-overlayPanel>
            </div>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .user-avatar {
      position: relative;
    }
    
    .avatar-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: var(--primary-color-text);
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 14px;
      
      &:hover {
        background-color: var(--primary-600);
      }
    }
    
    :host ::ng-deep .user-dropdown {
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 0;
      
      .p-overlaypanel-content {
        padding: 0;
      }
    }
    
    .user-dropdown-content {
      min-width: 200px;
      
      .user-info {
        padding: 12px 16px;
        
        .user-name {
          font-weight: 500;
          font-size: 14px;
          color: var(--text-color);
        }
      }
      
      .dropdown-divider {
        height: 1px;
        background-color: var(--surface-200);
        margin: 0;
      }
      
      .logout-button {
        display: flex;
        align-items: center;
        width: 100%;
        background: none;
        border: none;
        padding: 10px 16px;
        cursor: pointer;
        color: var(--text-color-secondary);
        font-size: 14px;
        text-align: left;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: var(--surface-hover);
          color: var(--text-color);
        }
        
        .logout-icon {
          margin-right: 8px;
          font-size: 14px;
        }
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  userName = '';
  
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    this.updateLoginStatus();
  }
  
  updateLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userName = this.authService.getUserName();
    }
  }
  
  getUserInitials(): string {
    if (!this.userName) return '?';
    
    return this.userName.charAt(0).toUpperCase();
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }
} 