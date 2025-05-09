import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AuthService } from './auth/auth.service';
import { LoginDialogComponent } from './auth/login-dialog/login-dialog.component';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule, 
    HeaderComponent, 
    FooterComponent,
    CommonModule,
    LoginDialogComponent,
    ToastModule
  ],
  template: `
    <div class="app-wrapper">
      <app-header></app-header>
      <main class="main-content">
        <div class="container">
          <div class="content-container">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      <app-footer></app-footer>
      <p-toast position="bottom-right"></p-toast>
    </div>
  `,
  styles: [`
    .app-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f8f9fa;
    }

    .main-content {
      flex: 1;
      margin-top: 48px;
      padding: 24px 0;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 0.5rem;
    }

    .content-container {
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      padding: 24px;
      min-height: calc(100vh - 200px);
    }

    :host ::ng-deep {
      .p-toast {
        z-index: 1000;
      }

      // 美化滚动条
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;

        &:hover {
          background: #a8a8a8;
        }
      }

      // 优化文字渲染
      * {
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Initialize the authentication service
    this.authService.isLoggedIn();
  }
} 