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
    <div class="min-h-screen flex flex-col bg-gray-50">
      <app-header></app-header>
      <main class="flex-grow container mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <p-toast position="bottom-right"></p-toast>
    </div>
  `,
  styles: [`
    :host {
      display: block;
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