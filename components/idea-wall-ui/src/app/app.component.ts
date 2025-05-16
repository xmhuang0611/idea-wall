import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AuthService } from './auth/auth.service';
import { LoginDialogComponent } from './auth/login-dialog/login-dialog.component';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { UserService } from './services/user.service';

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
            <router-outlet></router-outlet>
        </div>
      </main>
      <app-footer></app-footer>
      <p-toast position="bottom-right" class="global-toast"></p-toast>
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
      margin-top: 56px;
      padding: 24px 0;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 0.5rem;
    }

    /* Global scrollbar styles */
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
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Global text rendering optimization */
    * {
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Initialize the authentication service
    if (this.authService.isLoggedIn()) {
      const userId = this.authService.getId();
      if (userId) {
        this.userService.getUser(userId).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              console.log('Current user information:', response.data);
            }
          },
          error: (error) => {
            console.error('Error fetching user information:', error);
          }
        });
      }
    }
  }
} 