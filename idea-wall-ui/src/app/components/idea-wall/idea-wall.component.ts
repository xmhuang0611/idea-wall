import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { IdeaService } from '../../services/idea.service';
import { Idea } from '../../models/idea.model';
import { IdeaCardComponent } from '../idea-card/idea-card.component';

@Component({
  selector: 'app-idea-wall',
  template: `
    <div class="p-4">
      <div class="mb-4">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search"></i>
          <input 
            type="text" 
            pInputText 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()" 
            placeholder="搜索想法..." 
            class="w-full"
          />
        </span>
      </div>

      <p-dataView 
        #dv 
        [value]="ideas" 
        [paginator]="true" 
        [rows]="9"
        [sortField]="sortField" 
        [sortOrder]="sortOrder"
      >
        <ng-template pTemplate="header">
          <div class="flex justify-content-end">
            <p-dropdown 
              [options]="sortOptions" 
              [(ngModel)]="sortField" 
              placeholder="排序方式"
              (onChange)="onSortChange($event)"
            ></p-dropdown>
          </div>
        </ng-template>

        <ng-template let-idea pTemplate="listItem">
          <div class="col-12">
            <app-idea-card [idea]="idea"></app-idea-card>
          </div>
        </ng-template>

        <ng-template let-idea pTemplate="gridItem">
          <div class="col-12 md:col-4">
            <app-idea-card [idea]="idea"></app-idea-card>
          </div>
        </ng-template>
      </p-dataView>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DataViewModule,
    InputTextModule,
    DropdownModule,
    FormsModule,
    IdeaCardComponent
  ]
})
export class IdeaWallComponent implements OnInit {
  ideas: Idea[] = [];
  searchQuery: string = '';
  sortField: string = 'created_at';
  sortOrder: number = -1;
  
  sortOptions = [
    { label: '最新创建', value: 'created_at' },
    { label: '最多点赞', value: 'total_votes' }
  ];

  constructor(private ideaService: IdeaService) {}

  ngOnInit() {
    this.loadIdeas();
  }

  loadIdeas() {
    this.ideaService.getIdeas().subscribe({
      next: (response) => {
        this.ideas = response.data;
      },
      error: (error) => {
        console.error('加载想法失败', error);
      }
    });
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.ideaService.searchIdeas(this.searchQuery).subscribe({
        next: (response) => {
          this.ideas = response.data;
        },
        error: (error) => {
          console.error('搜索失败', error);
        }
      });
    } else {
      this.loadIdeas();
    }
  }

  onSortChange(event: any) {
    this.loadIdeas();
  }
} 