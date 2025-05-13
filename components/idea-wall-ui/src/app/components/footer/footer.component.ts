import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div class="footer-wrapper">
      <div class="container">
        <div class="flex justify-content-between align-items-center">
          <!-- Left Side -->
          <div class="flex align-items-center">
            <span>Idea Wall - your idea library, visit our</span>
            <a href="https://github.com/your-repo" target="_blank">GitHub repository</a>
            <span>to learn more.</span>
          </div>
          
          <!-- Right Side -->
          <div class="flex align-items-center">
            <span>© 2025 Idea Wall</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .footer-wrapper {
      background: #212529;
      color: #ffffff;
      height: 48px;
      display: flex;
      align-items: center;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      height: 100%;

      > div {
        height: 100%;
      }
    }

    span {
      font-size: 14px;
      opacity: 0.9;
    }

    a {
      color: #2196F3;
      text-decoration: none;
      font-size: 14px;
      margin: 0 4px;
      transition: color 0.2s;

      &:hover {
        color: #1976D2;
      }
    }
  `]
})
export class FooterComponent {} 