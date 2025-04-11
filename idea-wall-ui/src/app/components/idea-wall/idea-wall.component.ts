import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IdeaService } from '../../services/idea.service';
import { Idea } from '../../models/idea.model';

@Component({
  selector: 'app-idea-wall',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <!-- Breadcrumb -->
      <div class="mb-6 flex items-center text-gray-600">
        <a routerLink="/" class="hover:text-blue-600">Home</a>
        <span class="mx-2">></span>
        <span>Idea Wall</span>
      </div>

      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Idea Wall</h1>
        <button routerLink="/submit-idea"
                class="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center">
          <span class="text-xl mr-2">+</span>
          Submit Your Idea
        </button>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Search -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div class="relative">
            <input type="text"
                   [(ngModel)]="searchQuery"
                   (input)="onSearch()"
                   placeholder="Search ideas..."
                   class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <span class="absolute right-3 top-2.5 text-gray-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
          </div>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select [(ngModel)]="selectedCategory"
                  (change)="onFilterChange()"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Categories</option>
            <option *ngFor="let category of categories" [value]="category">
              {{category}}
            </option>
          </select>
        </div>

        <!-- Sort -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select [(ngModel)]="sortBy"
                  (change)="onSortChange()"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="created_at">Latest Created</option>
            <option value="total_votes">Most Upvoted</option>
          </select>
        </div>
      </div>

      <!-- Ideas List -->
      <div class="space-y-4">
        <div *ngFor="let idea of ideas"
             class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex">
            <!-- Vote Column -->
            <div class="flex flex-col items-center mr-6 w-16">
              <button (click)="onVote(idea, 1)"
                      class="text-gray-500 hover:text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
              </button>
              <span class="text-lg font-semibold my-1">{{idea.total_votes}}</span>
              <button (click)="onVote(idea, -1)"
                      class="text-gray-500 hover:text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>

            <!-- Content Column -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-900">{{idea.title}}</h3>
                <span class="px-3 py-1 rounded-full text-sm"
                      [class]="getCategoryClass(idea.category)">
                  {{idea.category}}
                </span>
              </div>
              <p class="text-gray-600 mb-3 line-clamp-2">{{idea.description}}</p>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center space-x-4">
                  <span>By {{idea.created_by}}</span>
                  <span>{{idea.created_at | date:'medium'}}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span *ngFor="let tag of idea.tags" 
                        class="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {{tag}}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          Showing {{(currentPage - 1) * pageSize + 1}} to {{Math.min(currentPage * pageSize, totalItems)}} of {{totalItems}} ideas
        </div>
        <div class="flex space-x-2">
          <button (click)="onPageChange(currentPage - 1)"
                  [disabled]="currentPage === 1"
                  class="px-4 py-2 border rounded-md"
                  [class.opacity-50]="currentPage === 1">
            Previous
          </button>
          <button (click)="onPageChange(currentPage + 1)"
                  [disabled]="currentPage * pageSize >= totalItems"
                  class="px-4 py-2 border rounded-md"
                  [class.opacity-50]="currentPage * pageSize >= totalItems">
            Next
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="ideas?.length === 0" 
           class="text-center py-12">
        <p class="text-gray-500">No ideas found matching your criteria.</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  
  // 搜索和筛选条件
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // 分页
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;

  // 类别选项
  categories = ['Idea', 'Pain', 'Thought'];

  constructor(private ideaService: IdeaService) {}

  ngOnInit(): void {
    this.loadIdeas();
  }

  loadIdeas(): void {
    this.ideaService.getIdeas({
      page: this.currentPage,
      page_size: this.pageSize,
      category: this.selectedCategory || undefined,
      search: this.searchQuery || undefined,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    }).subscribe({
      next: (response) => {
        console.log(response);
        this.ideas = response.data;
        if (response.meta) {
          this.totalItems = response.meta.total;
        }
      },
      error: (error) => {
        console.error('Failed to load ideas', error);
        // TODO: 添加错误提示
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadIdeas();
  }

  onSortChange(): void {
    this.loadIdeas();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadIdeas();
  }

  onVote(idea: Idea, voteStatus: number): void {
    this.ideaService.voteIdea(idea._id, voteStatus).subscribe({
      next: () => {
        this.loadIdeas(); // 重新加载以获取最新投票数
      },
      error: (error) => {
        console.error('Failed to vote', error);
        // TODO: 添加错误提示
      }
    });
  }

  getCategoryClass(category: string): string {
    switch (category) {
      case 'Idea':
        return 'bg-blue-100 text-blue-800';
      case 'Pain':
        return 'bg-red-100 text-red-800';
      case 'Thought':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  protected readonly Math = Math;
} 