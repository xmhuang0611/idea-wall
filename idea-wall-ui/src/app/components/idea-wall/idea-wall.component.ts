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
      <!-- Header with Tabs -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-1">
            <div class="flex rounded-lg bg-gray-100 p-1">
              <button *ngFor="let cat of categories"
                      (click)="onCategorySelect(cat)"
                      class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      [class.bg-blue-500]="selectedCategory === cat"
                      [class.shadow-sm]="selectedCategory === cat"
                      [class.text-white]="selectedCategory === cat"
                      [class.text-gray-900]="selectedCategory === cat"
                      [class.text-gray-600]="selectedCategory !== cat">
                {{cat}}
              </button>
            </div>
          </div>
          <button routerLink="/submit-idea"
                  class="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center">
            <span class="text-xl mr-2">+</span>
            Submit Your Idea
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <!-- Ideas List -->
      <div class="space-y-4">
        <div *ngFor="let idea of ideas"
             class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex">
            <!-- Like Column -->
            <div class="flex flex-col items-center mr-6 w-16">
              <button (click)="onVote(idea, idea.hasVoted ? 0 : 1)"
                      class="text-gray-500 hover:text-blue-600">
                <svg class="w-6 h-6" [class.text-blue-600]="idea.hasVoted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-6.5"/>
                </svg>
              </button>
              <span class="text-lg font-semibold my-1">{{idea.total_votes}}</span>
            </div>

            <!-- Content Column -->
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-900">{{idea.title}}</h3>
              </div>
              <p class="text-gray-600 mb-3 line-clamp-2">{{idea.description}}</p>
              <div class="flex items-center justify-between text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
                <div class="flex items-center space-x-2">
                  <span *ngFor="let tag of idea.tags" 
                        class="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {{tag}}
                  </span>
                </div>
                <div class="flex items-center space-x-4 text-gray-500">
                  <span>By {{idea.created_by}}</span>
                  <span>{{idea.created_at | date:'medium'}}</span>
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
  selectedCategory = 'Idea';
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
        this.ideas = response.data.map(idea => ({
          ...idea,
          hasVoted: idea.user_vote ? idea.user_vote > 0 : false
        }));
        if (response.meta) {
          this.totalItems = response.meta.total;
        }
      },
      error: (error) => {
        console.error('Failed to load ideas', error);
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
        idea.hasVoted = voteStatus > 0;
        idea.total_votes += voteStatus - (idea.user_vote || 0);
        idea.user_vote = voteStatus;
      },
      error: (error) => {
        console.error('Failed to vote', error);
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

  onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.loadIdeas();
  }

  protected readonly Math = Math;
} 