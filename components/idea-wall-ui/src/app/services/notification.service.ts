import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'vote' | 'bookmark';
  content: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
  creator_id: string;
  creator_name: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';
  private wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/notifications`;
  
  // BehaviorSubjects for real-time data
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  
  // Public observables
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  
  // WebSocket connection
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  
  // Polling interval (30 seconds) - fallback for when WebSocket is not available
  private pollingInterval$ = interval(30000);
  
  constructor(private http: HttpClient) {
    // Only initialize if user is authenticated
    if (this.getAuthToken()) {
      this.initializeWebSocket();
    }
    this.startPolling();
  }

  /**
   * Initialize WebSocket connection
   */
  private initializeWebSocket(): void {
    // Only connect if user is authenticated
    const token = this.getAuthToken();
    if (!token) {
      console.log('No auth token available, skipping WebSocket connection');
      return;
    }

    try {
      this.ws = new WebSocket(`${this.wsUrl}?token=${encodeURIComponent(token)}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Send initial ping
        this.sendWebSocketMessage({ type: 'ping' });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'unread_count':
        console.log('Updating unread count to:', message.data);
        this.unreadCountSubject.next(message.data);
        break;
      case 'new_notification':
        console.log('New notification received, refreshing list...');
        // Immediately refresh notifications list when new notification arrives
        this.loadNotifications();
        break;
      case 'pong':
        console.log('Received pong from server');
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Send message via WebSocket
   */
  private sendWebSocketMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Schedule WebSocket reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.log('Max reconnect attempts reached, giving up on WebSocket');
    }
  }

  /**
   * Get authentication token from localStorage or sessionStorage
   */
  private getAuthToken(): string | null {
    // This should match your authentication implementation
    return localStorage.getItem('local_token') || localStorage.getItem('id_token');
  }

  /**
   * Start polling for notifications (fallback)
   */
  private startPolling(): void {
    // Initial load
    this.loadNotifications();
    this.loadUnreadCount();
    
    // Set up polling as fallback
    this.pollingInterval$.pipe(
      switchMap(() => this.loadUnreadCount()),
      catchError(error => {
        console.error('Error polling notifications:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Get notifications with pagination
   */
  getNotifications(skip: number = 0, limit: number = 20): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  /**
   * Load notifications and update subject
   */
  loadNotifications(skip: number = 0, limit: number = 20): void {
    this.getNotifications(skip, limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationsSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Load unread count and update subject
   */
  loadUnreadCount(): Observable<UnreadCountResponse> {
    return this.getUnreadCount().pipe(
      tap(response => {
        if (response.success) {
          this.unreadCountSubject.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Error loading unread count:', error);
        return of({ success: false, data: 0 });
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local state
        this.loadNotifications();
        // Don't call loadUnreadCount() here as WebSocket will handle it
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        // Update local state
        this.loadNotifications();
        // Don't update unread count here as WebSocket will handle it
      })
    );
  }

  /**
   * Get current unread count value
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Get current notifications value
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Refresh notifications manually
   */
  refresh(): void {
    this.loadNotifications();
    
    // Request refresh via WebSocket if available
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({ type: 'refresh_notifications' });
    } else {
      this.loadUnreadCount();
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Initialize or reconnect WebSocket (public method)
   */
  public connect(): void {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.initializeWebSocket();
    }
  }
}