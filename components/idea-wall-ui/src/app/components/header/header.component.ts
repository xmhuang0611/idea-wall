import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, OverlayPanelModule],
  template: `
    <header class="bg-white shadow-sm">
      <nav class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Logo and Brand -->
          <div class="flex items-center space-x-4">
            <a routerLink="/" class="flex items-center space-x-2">
              <span class="text-xl font-bold text-blue-600">Idea Wall</span>
            </a>
            
            <!-- Navigation Links -->
            <div class="hidden md:flex space-x-6">
              <a routerLink="/" class="text-gray-600 hover:text-blue-600">Home</a>
              <a routerLink="/ideas" class="text-gray-600 hover:text-blue-600">Ideas</a>
              <div class="relative group">
                <button class="text-gray-600 hover:text-blue-600">
                  Useful Links
                </button>
              </div>
              <a routerLink="/about" class="text-gray-600 hover:text-blue-600">About</a>
            </div>
          </div>

          <!-- Right Side -->
          <div class="flex items-center space-x-4">
            <button *ngIf="!isLoggedIn" 
                    (click)="login()"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Login
            </button>
            
            <!-- User Avatar with Dropdown -->
            <div *ngIf="isLoggedIn" class="flex items-center space-x-2">
              <button *ngIf="isAdmin" class="settings-button" (click)="goToSettings()">
                <i class="pi pi-cog"></i>
              </button>
              <div class="relative user-avatar">
                <div class="avatar-circle" (click)="op.toggle($event)">
                  {{ getUserInitials() }}
                </div>
                
                <p-overlayPanel #op [showCloseIcon]="false" [style]="{width: '220px'}" styleClass="user-dropdown">
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
          </div>
        </div>
      </nav>
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
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #3b82f6;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #2563eb;
      }
    }

    .settings-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f3f4f6;
      color: #4b5563;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: #e5e7eb;
        color: #1f2937;
      }

      i {
        font-size: 1.2rem;
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
      display: flex;
      flex-direction: column;
      
      .user-info {
        padding: 16px;
        
        .user-name {
          font-weight: 500;
          font-size: 16px;
          color: #1f2937;
        }
      }
      
      .dropdown-divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 0;
      }
      
      .logout-button {
        display: flex;
        align-items: center;
        background: none;
        border: none;
        padding: 12px 16px;
        cursor: pointer;
        color: #4b5563;
        font-size: 14px;
        text-align: left;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #f3f4f6;
          color: #1f2937;
        }
        
        .logout-icon {
          margin-right: 8px;
          font-size: 16px;
        }
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  userName = '';
  isAdmin = false;
  
  constructor(private authService: AuthService, private router: Router) {}
  
  ngOnInit() {
    this.updateLoginStatus();
  }
  
  updateLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userName = this.authService.getUserName();
      this.authService.getUserRoles().subscribe(roles => {
        this.isAdmin = roles.includes('ADMIN');
      });
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
    // First navigate to home if not already there
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        // After navigation is complete, perform logout
        this.authService.logout();
      });
    } else {
      // If already on home page, just logout
      this.authService.logout();
    }
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
} 