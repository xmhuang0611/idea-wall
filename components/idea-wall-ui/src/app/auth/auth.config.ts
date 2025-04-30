import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  loginUrl: '/oauth/authorize',
  logoutUrl: `/oauth/logout?redirect_uri=${window.location.origin}`,
  requireHttps: false,
  redirectUri: window.location.href,
  clientId: '',
  scope: 'read',
  oidc: false,
  showDebugInformation: false,
  responseType: 'token',
  strictDiscoveryDocumentValidation: false,
  skipIssuerCheck: true,
  customQueryParams: {
    domain: 'draft'
  }
}; 