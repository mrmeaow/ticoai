import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    @if (authService.isAuthenticated()) {
      <app-header />
      <main class="min-h-screen bg-gray-50">
        <router-outlet />
      </main>
    } @else {
      <router-outlet />
    }
  `,
})
export class App {
  authService = inject(AuthService);
}
