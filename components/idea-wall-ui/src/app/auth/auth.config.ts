import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  // Authentication server URL
  issuer: 'http://localhost:8080/realms/idea-wall',
  
  // Client ID
  clientId: 'idea-wall-ui',
  
  // Redirect URI
  redirectUri: window.location.origin + '/index.html',
  
  // Scope
  scope: 'openid profile email',
  
  // Response type
  responseType: 'code',
  
  // Whether to use PKCE
  usePKCE: true,
  
  // Whether to clear hash after login
  clearHashAfterLogin: true,
  
  // Whether to load user profile after login
  loadUserProfile: true,
  
  // Whether to require HTTPS
  requireHttps: false,
  
  // Whether to show debug information
  showDebugInformation: true
}; 