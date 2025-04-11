import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen flex flex-column">
      <app-header></app-header>
      <main class="flex-grow-1">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent]
})
export class AppComponent {} 