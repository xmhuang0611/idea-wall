import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <header class="bg-white shadow-sm">
      <nav class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Logo and Brand -->
          <div class="flex items-center space-x-4">
            <a routerLink="/" class="flex items-center space-x-2">
              <span class="text-xl font-bold text-blue-600">Tech Compass</span>
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
                    routerLink="/login"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Login
            </button>
            <button *ngIf="isLoggedIn" 
                    (click)="logout()"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HeaderComponent {
  constructor(private authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }
} 