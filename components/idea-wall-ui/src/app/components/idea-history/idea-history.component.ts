import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeaHistory } from '../../models/idea.model';
import { IdeaService } from '../../services/idea.service';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { FeelingUtilService } from '../../shared/services/feeling-util.service';

@Component({
  selector: 'app-idea-history',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    DividerModule,
    ProgressSpinnerModule,
    TimelineModule,
    CardModule
  ],
  templateUrl: './idea-history.component.html',
  styleUrls: ['./idea-history.component.scss']
})
export class IdeaHistoryComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() ideaId: string = '';
  
  historyRecords: IdeaHistory[] = [];
  isLoading: boolean = false;
  
  constructor(
    private ideaService: IdeaService,
    public feelingUtil: FeelingUtilService
  ) {}
  
  ngOnInit(): void {
    // History will be loaded when dialog becomes visible
  }
  
  /**
   * Load idea history when dialog becomes visible
   */
  onDialogShow(): void {
    if (this.ideaId) {
      this.loadIdeaHistory();
    }
  }
  
  /**
   * Update visible state and emit change event
   * @param value New visible state
   */
  updateVisibleState(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }
  
  /**
   * Load idea history from the server
   */
  loadIdeaHistory(): void {
    this.isLoading = true;
    this.ideaService.getIdeaHistory(this.ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.historyRecords = response.data.map(record => ({
            ...record,
            created_at: new Date(record.created_at)
          }));
        } else {
          this.historyRecords = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading idea history:', error);
        this.historyRecords = [];
        this.isLoading = false;
      }
    });
  }
} 