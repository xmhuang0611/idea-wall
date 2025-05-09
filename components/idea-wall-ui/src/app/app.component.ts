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
          <router-outlet></router-outlet>
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    :host ::ng-deep {
      .p-toast {
        z-index: 1000;
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