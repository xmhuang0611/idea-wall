import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, AvatarModule, OverlayPanelModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  
  constructor(private authService: AuthService, private router: Router) {}
  username = '';

  
  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.authService.getUserRoles().subscribe(roles => {
        this.isAdmin = roles.includes('ADMIN');
      });
      this.username = this.authService.getUserName() || 'User';
    }
  }

  login() {
    this.authService.login();
    this.isLoggedIn = true;
    this.username = this.authService.getUserName() || 'User';
  }

  logout(): void {
    // First navigate to home if not already there
    if (this.router.url !== '/') {
      this.router.navigate(['/']);
    }
    
    // Then logout
    setTimeout(() => {
      this.authService.logout();
      this.isLoggedIn = false;
    }, 100);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
}