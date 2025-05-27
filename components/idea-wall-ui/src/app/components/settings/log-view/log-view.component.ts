import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { LogService, LogEntry } from '../../../services/log.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-log-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    ProgressSpinnerModule,
    PaginatorModule,
    DialogModule
  ],
  templateUrl: './log-view.component.html'
})
export class LogViewComponent implements OnInit {
  logs: LogEntry[] = [];
  totalRecords = 0;
  loading = false;
  first = 0;
  rows = 10;
  
  searchForm: FormGroup;
  
  objectTypes = [
    { label: 'All', value: '' },
    { label: 'Idea', value: 'Idea' },
    { label: 'Comment', value: 'Comment' },
    { label: 'Vote', value: 'Vote' },
    { label: 'Bookmark', value: 'Bookmark' },
    { label: 'Tag', value: 'Tag' },
    { label: 'User', value: 'User' },
    { label: 'Review', value: 'Review' },
    { label: 'Final Decision', value: 'Final Decision' }
  ];

  /**
   * Dialog state for viewing object_data
   */
  objectDataDialogVisible = false;
  objectDataDialogContent = '';

  selectedLogs: LogEntry[] = [];
  compareDialogVisible = false;
  compareDiffHtml: SafeHtml = '';

  constructor(
    private logService: LogService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.searchForm = this.fb.group({
      object_type: [''],
      object_id: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
    
    // Listen to form changes and auto search
    this.searchForm.valueChanges.subscribe(() => {
      this.first = 0; // Reset to first page
      this.loadLogs();
    });
  }

  loadLogs(): void {
    this.loading = true;
    const { object_type, object_id } = this.searchForm.value;
    
    const params = {
      page: Math.floor(this.first / this.rows) + 1,
      page_size: this.rows,
      object_type: object_type || undefined,
      object_id: object_id || undefined
    };

    this.logService.getLogs(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.logs = response.data;
          this.totalRecords = response.pagination?.total || 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadLogs();
  }

  resetSearch(): void {
    this.searchForm.reset({
      object_type: '',
      object_id: ''
    });
  }

  /**
   * Show object_data in dialog
   */
  showObjectData(log: LogEntry): void {
    try {
      this.objectDataDialogContent = JSON.stringify(JSON.parse(log.object_data), null, 2);
    } catch {
      this.objectDataDialogContent = log.object_data || '';
    }
    this.objectDataDialogVisible = true;
  }

  canCompareSelected(): boolean {
    return this.selectedLogs.length === 2 &&
      this.selectedLogs[0].object_type === this.selectedLogs[1].object_type &&
      this.selectedLogs[0].object_id === this.selectedLogs[1].object_id;
  }

  compareSelectedLogs(): void {
    if (!this.canCompareSelected()) {
      this.compareDiffHtml = 'Selected logs are not for the same object and cannot be compared.';
      this.compareDialogVisible = true;
      return;
    }
    const [logA, logB] = this.selectedLogs;
    let objA, objB;
    try {
      objA = JSON.parse(logA.object_data);
      objB = JSON.parse(logB.object_data);
    } catch {
      this.compareDiffHtml = 'Failed to parse object_data.';
      this.compareDialogVisible = true;
      return;
    }
    // Simple diff: highlight changed fields
    const diffHtml = this.generateDiffHtml(objA, objB);
    this.compareDiffHtml = this.sanitizer.bypassSecurityTrustHtml(diffHtml);
    this.compareDialogVisible = true;
  }

  generateDiffHtml(a: any, b: any): string {
    const allKeys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    let html = '<table style="width:100%;border-collapse:collapse;">';
    html += '<tr><th style="border:1px solid #ccc;padding:4px;">Field</th>' +
      '<th style="border:1px solid #ccc;padding:4px;">A</th>' +
      '<th style="border:1px solid #ccc;padding:4px;">B</th></tr>';
    for (const key of allKeys) {
      const valA = a[key];
      const valB = b[key];
      const isObject = typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null;
      const changed = isObject
        ? JSON.stringify(valA) !== JSON.stringify(valB)
        : valA !== valB;
      html += `<tr>` +
        `<td style="border:1px solid #ccc;padding:4px;">${key}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;${changed ? 'background:#ffe0e0;' : ''}">${valA === undefined ? '' : JSON.stringify(valA)}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;${changed ? 'background:#e0ffe0;' : ''}">${valB === undefined ? '' : JSON.stringify(valB)}</td>` +
        `</tr>`;
    }
    html += '</table>';
    return html;
  }
} 