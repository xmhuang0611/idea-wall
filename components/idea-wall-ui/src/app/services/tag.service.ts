import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Tag } from '../models/tag.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = '/api/tags';  // Use relative path

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  getTags(params: {
    skip?: number;
    limit?: number;
  } = {}): Observable<ApiResponse<Tag[]>> {
    let httpParams = new HttpParams();
    
    if (params.skip) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiResponse<Tag[]>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }
  
  getAllTags(): Observable<ApiResponse<Tag[]>> {
    return this.http.get<ApiResponse<Tag[]>>(`${this.apiUrl}/all`);
  }

  getTagsWithHierarchy(): Observable<ApiResponse<Tag[]>> {
    return this.getAllTags().pipe(
      map(response => {
        if (response.success && response.data) {
          // Get all tags
          const allTags = response.data;
          
          // Create a map of tag ID to tag object
          const tagMap = new Map<number, Tag>();
          allTags.forEach(tag => {
            // Ensure each tag has a children array
            const tagWithChildren: Tag = {
              ...tag,
              children: tag.children || []  // Initialize children if not exists
            };
            tagMap.set(tag.tag_id, tagWithChildren);
          });
          
          // Get all parent tags (parent_id = 0)
          const parentTags = allTags
            .filter(tag => tag.parent_id === 0)
            .map(tag => tagMap.get(tag.tag_id)!);
          
          // Build hierarchy
          allTags.forEach(tag => {
            if (tag.parent_id > 0) {
              const parent = tagMap.get(tag.parent_id);
              const child = tagMap.get(tag.tag_id);
              if (parent && child) {
                // Ensure parent has children array
                if (!parent.children) {
                  parent.children = [];
                }
                parent.children.push(child);
              }
            }
          });
          
          return {
            ...response,
            data: parentTags
          };
        }
        return response;
      })
    );
  }

  createTag(tag: Partial<Tag>): Observable<ApiResponse<Tag>> {
    return this.http.post<ApiResponse<Tag>>(this.apiUrl, tag)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Tag created successfully');
          } else {
            this.toastService.showError(`Failed to create tag: ${response.error?.message}`);
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  updateTag(tagId: number, tag: Partial<Tag>): Observable<ApiResponse<Tag>> {
    return this.http.put<ApiResponse<Tag>>(`${this.apiUrl}/${tagId}`, tag)
    .pipe(
      tap(response => {
        if (response.success) {
          this.toastService.showSuccess('Tag updated successfully');
        } else {
          this.toastService.showError(`Failed to update tag: ${response.error?.message}`);
        }
      }),
      catchError(this.errorHandler.handleError)
    );
  }

  deleteTag(tagId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${tagId}`)
    .pipe(
      tap(response => {
        if (response.success) {
          this.toastService.showSuccess('Tag deleted successfully');
        } else {
          this.toastService.showError(`Failed to delete tag: ${response.error?.message}`);
        }
      }),
      catchError(this.errorHandler.handleError)
    );
  }
} 