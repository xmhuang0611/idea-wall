import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule],
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
          <div>
            <button pButton
                    label="Login"
                    class="login-button"
                    (click)="login()">
            </button>
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      height: 48px;
    }

    nav {
      height: 100%;
    }

    .logo-link {
      color: #2196F3;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin-right: 32px;
    }

    .nav-links {
      display: flex;
      gap: 24px;

      a {
        color: #495057;
        text-decoration: none;
        font-size: 14px;
        font-weight: 400;
        transition: color 0.2s;

        &:hover {
          color: #2196F3;
        }
      }
    }

    :host ::ng-deep .login-button {
      font-size: 14px;
      padding: 0.5rem 1rem;
      background: #2196F3;
      border: none;
      border-radius: 4px;

      &:hover {
        background: #1976D2;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  constructor(private authService: AuthService) {}
  
  ngOnInit() {}

  login() {
    this.authService.login();
  }
} 