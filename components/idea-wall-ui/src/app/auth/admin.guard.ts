import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    if (!this.authService.isLoggedIn()) {
      this.authService.login();
      return of(false);
    }

    return this.authService.getUserRoles().pipe(
      map(roles => {
        const isAdmin = roles.includes('ADMIN');
        if (!isAdmin) {
          this.router.navigate(['/']);
        }
        return isAdmin;
      }),
      catchError(() => {
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
} 