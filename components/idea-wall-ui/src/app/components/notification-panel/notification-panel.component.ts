import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { OverlayPanel } from 'primeng/overlaypanel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { NotificationService, Notification } from '../../services/notification.service';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    CommonModule,
    OverlayPanelModule,
    ScrollPanelModule,
    BadgeModule,
    TooltipModule,
    AvatarModule
  ],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  @ViewChild('notificationPanel') notificationPanel!: OverlayPanel;
  
  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  /**
   * Get current unread count safely
   */
  get currentUnreadCount(): number {
    return this.notificationService.getCurrentUnreadCount();
  }

  /**
   * Get badge value for display
   */
  get badgeValue(): string | undefined {
    const count = this.currentUnreadCount;
    return count > 0 ? count.toString() : undefined;
  }

  ngOnInit(): void {
    // Only start polling if user is logged in
    if (this.authService.isLoggedIn()) {
      this.notificationService.refresh();
      this.notificationService.connect(); // Connect WebSocket
    }

    // Listen for login status changes
    this.subscription.add(
      this.authService.getLoginStatus().subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.notificationService.connect();
          this.notificationService.refresh();
        } else {
          this.notificationService.disconnect();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Handle notification panel toggle
   */
  onNotificationPanelToggle(event: Event): void {
    this.notificationPanel.toggle(event);
  }

  /**
   * Handle panel show event - refresh notifications when panel opens
   */
  onPanelShow(): void {
    console.log('Notification panel opened, refreshing notifications...');
    this.notificationService.refresh();
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          console.log('Notification marked as read');
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'comment':
        return 'pi pi-comment';
      case 'vote':
        return 'pi pi-heart';
      case 'bookmark':
        return 'pi pi-bookmark';
      default:
        return 'pi pi-bell';
    }
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type: string): string {
    switch (type) {
      case 'comment':
        return '#3B82F6'; // blue
      case 'vote':
        return '#EF4444'; // red
      case 'bookmark':
        return '#10B981'; // green
      default:
        return '#6B7280'; // gray
    }
  }

  /**
   * Format relative time
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
} 