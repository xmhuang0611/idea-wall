import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <footer class="bg-gray-900 text-white py-8">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <p class="text-sm">
              Idea Wall - your idea library, visit our 
              <a href="https://github.com" 
                 target="_blank" 
                 class="text-blue-400 hover:text-blue-300">
                GitHub repository
              </a> 
              to learn more.
            </p>
          </div>
          
          <div class="flex space-x-6">
            <a routerLink="/home" class="text-sm text-gray-300 hover:text-white">Home</a>
            <a routerLink="/ideas" class="text-sm text-gray-300 hover:text-white">Ideas</a>
            <a routerLink="/about" class="text-sm text-gray-300 hover:text-white">About</a>
          </div>
          
          <div class="mt-4 md:mt-0">
            <p class="text-sm text-gray-400">© 2025 Idea Wall</p>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FooterComponent {} 