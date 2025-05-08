import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoleDisplayService {
  private roleDisplayMap: { [key: string]: string } = {
    'IDEA_SESSION_PANEL_REVIEWER': 'Session Panel Reviewer',
    'IDEA_SESSION_PANEL_ADMIN': 'Session Panel Admin',
    'IDEA_SESSION_PANEL_MEMBER': 'Session Panel Member',
    'IDEA_SESSION_PANEL_LEADER': 'Session Panel Leader',
    'ADMIN': 'Administrator'
  };

  getDisplayName(role: string): string {
    return this.roleDisplayMap[role] || role;
  }

  getDisplayNames(roles: string[]): string[] {
    return roles.map(role => this.getDisplayName(role));
  }
} 