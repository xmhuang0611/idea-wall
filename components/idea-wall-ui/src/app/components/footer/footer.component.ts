import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <footer class="bg-900 text-white">
      <div class="container mx-auto px-4 py-2">
        <div class="flex justify-content-between align-items-center">
          <div class="text-sm">
            Idea Wall - your idea library, visit our 
            <a href="https://github.com" 
               target="_blank" 
               class="text-primary hover:text-primary-400">
              GitHub repository
            </a>
            to learn more.
          </div>
          
          <div class="flex gap-6">
            <a routerLink="/home" class="text-300 hover:text-white">Home</a>
            <a routerLink="/ideas" class="text-300 hover:text-white">Ideas</a>
            <a routerLink="/about" class="text-300 hover:text-white">About</a>
          </div>
          
          <div class="text-sm text-400">
            © 2025 Idea Wall
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    footer {
      font-size: 14px;
    }
  `]
})
export class FooterComponent {} 