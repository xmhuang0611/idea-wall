import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, AvatarModule, OverlayPanelModule, NotificationPanelComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isAdmin = false;
  username = '';
  currentRoute = '';

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  constructor(private authService: AuthService, private router: Router) {}
  
  ngOnInit() {
    if (this.isLoggedIn) {
      this.authService.getUserRoles().subscribe(roles => {
        this.isAdmin = roles.includes('ADMIN');
      });
      this.username = this.authService.getUserName();
    }

    // Track current route
    this.currentRoute = this.router.url;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentRoute = (event as NavigationEnd).url;
      });
  }

  /**
   * Check if the given route is currently active
   */
  isRouteActive(route: string): boolean {
    if (route === '/') {
      return this.currentRoute === '/' || this.currentRoute.startsWith('/idea/');
    }
    return this.currentRoute.startsWith(route);
  }

  login() {
    this.authService.login();
    this.username = this.authService.getUserName();
  }

  logout(): void {
    // First navigate to home if not already there
    if (this.router.url !== '/') {
      this.router.navigate(['/']);
    }
    
    // Then logout
    setTimeout(() => {
      this.authService.logout();
      this.isAdmin = false;
      this.username = '';
    }, 100);
  }

  goToSettings(): void {
    if (this.isAdmin) {
      this.router.navigate(['/settings']);
    }
  }
}