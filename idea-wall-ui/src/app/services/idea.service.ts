import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Idea } from '../models/idea.model';

@Injectable({
  providedIn: 'root'
})
export class IdeaService {
  private apiUrl = '/api/ideas';

  constructor(private http: HttpClient) {}

  getIdeas(page: number = 1, pageSize: number = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&page_size=${pageSize}`);
  }

  searchIdeas(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?q=${query}`);
  }

  voteIdea(ideaId: string, voteStatus: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ideaId}/vote`, { vote_status: voteStatus });
  }

  addComment(ideaId: string, comment: string, parentId?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ideaId}/comments`, {
      description: comment,
      parent_id: parentId
    });
  }
} 