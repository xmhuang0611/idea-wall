import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionReviewComponent } from '../session-review/session-review.component';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-session-review-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SessionReviewComponent,
    CardModule,
    TabViewModule
  ],
  template: `
    <div class="container">
      <div class="surface-card p-4 shadow-2 border-round mt-4">
        <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
          <h1 class="text-2xl font-semibold m-0">Review Center</h1>
        </div>
        
        <p-tabView>
          <p-tabPanel header="Session Reviews">
            <app-session-review></app-session-review>
          </p-tabPanel>
          <!-- Other review tabs can be added here, such as Incubator reviews -->
        </p-tabView>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-tabview-panels {
        padding: 1.25rem 0;
      }
      
      .container app-session-review > .container {
        padding: 0;
      }
      
      .container app-session-review > .container > .surface-card {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin-top: 0 !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionReviewCenterComponent implements OnInit {
  constructor() {}
  
  ngOnInit(): void {}
} 