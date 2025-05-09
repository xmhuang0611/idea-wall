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
    <div class="min-h-screen flex flex-column">
      <app-header></app-header>
      <main class="flex-grow surface-ground">
        <div class="container mx-auto px-4 py-6">
          <router-outlet></router-outlet>
        </div>
      </main>
      <app-footer></app-footer>
      <p-toast position="bottom-right"></p-toast>
    </div>
  `,
  styles: [`
    :host {
      display: block;
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