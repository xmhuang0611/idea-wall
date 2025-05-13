import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, AvatarModule, OverlayPanelModule],
  template: `
    <div class="header-wrapper">
      <div class="container">
        <nav class="flex align-items-center justify-content-between">
          <!-- Left Side -->
          <div class="flex align-items-center">
            <a routerLink="/" class="logo-link">Idea Wall</a>
            <div class="nav-links">
              <a routerLink="/">Home</a>
              <a routerLink="/ideas">Ideas</a>
              <a routerLink="/useful-links">Useful Links</a>
              <a routerLink="/about">About</a>
            </div>
          </div>
          
          <!-- Right Side -->
          <div class="flex">
            <p-avatar 
              *ngIf="isAdmin"
              icon="pi pi-cog"
              shape="circle"
              [style]="{'color': 'var(--primary-color)'}"
              class="cursor-pointer mr-2"
              (click)="goToSettings()">
            </p-avatar>
            <ng-container *ngIf="!isLoggedIn; else userIcon">
              <button pButton
                      label="Login"
                      class="login-button"
                      (click)="login()">
              </button>
            </ng-container>
            <ng-template #userIcon>
              <p-avatar 
                icon="pi pi-user"
                shape="circle"
                [style]="{'color': 'var(--primary-color)'}"
                class="cursor-pointer"
                (click)="op.toggle($event)">
              </p-avatar>
              <p-overlayPanel #op [style]="{'padding': '0'}" styleClass="user-dropdown">
                <div class="user-menu">
                  <div class="menu-item">
                    <span class="username">{{ username }}</span>
                  </div>
                  <div class="menu-item">
                    <button 
                      pButton 
                      type="button"
                      class="p-button-text p-button-plain logout-btn"
                      (click)="logout(); op.hide()">
                      <i class="pi pi-sign-out mr-2"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </p-overlayPanel>
            </ng-template>
          </div>
        </nav>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .header-wrapper {
      background: #ffffff;
      border-bottom: 1px solid #dee2e6;
      width: 100%;
    }

    .container {
      margin: 0 20px;
      padding: 0 0.5rem;
      height: 48px;
    }

    nav {
      height: 100%;
    }

    .logo-link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 1.25rem;
      margin-right: 32px;
    }

    .nav-links {
      display: flex;
      gap: 24px;

      a {
        color: var(--text-color);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 0.2s;

        &:hover {
          color: var(--primary-color);
        }
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

    .user-menu {
      min-width: 180px;
    }

    .menu-item {
      padding: 0.75rem 1rem;

      &:not(:last-child) {
        border-bottom: 1px solid var(--surface-200);
      }
    }

    .username {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-color-secondary);
    }

    :host ::ng-deep {
      .login-button {
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
        background: var(--primary-color);
        border: none;
        border-radius: 4px;
        font-weight: 500;

        &:hover {
          background: var(--primary-600);
        }
      }

      .p-avatar {
        width: 2rem;
        height: 2rem;

        &:hover {
          opacity: 0.9;
        }
      }

      .user-dropdown {
        .p-overlaypanel-content {
          padding: 0;
        }
      }

      .logout-btn {
        width: 100%;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        color: #ef4444;
        font-size: 0.875rem;
        font-weight: 400;
        text-align: left;

        .pi-sign-out {
          font-size: 0.875rem;
          margin-right: 0.5rem;
        }

        &:hover {
          background: transparent;
          color: #dc2626;
        }

        &:focus {
          box-shadow: none;
        }
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  
  constructor(private authService: AuthService, private router: Router) {}
  username = '';

  
  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.authService.getUserRoles().subscribe(roles => {
        this.isAdmin = roles.includes('ADMIN');
      });
      this.username = this.authService.getUserName() || 'User';
    }
  }

  login() {
    this.authService.login();
    this.isLoggedIn = true;
    this.username = this.authService.getUserName() || 'User';
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
    this.isLoggedIn = false;
    this.username = '';
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
} 
}