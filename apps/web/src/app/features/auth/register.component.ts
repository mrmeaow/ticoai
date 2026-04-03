import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 class="text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Join TICOAI support system
          </p>
        </div>

        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minlength="2"
                [(ngModel)]="name"
                #nameModel="ngModel"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                [class.border-red-300]="nameModel.invalid && nameModel.touched"
              />
              @if (nameModel.invalid && nameModel.touched) {
                <p class="mt-1 text-sm text-red-600">Name must be at least 2 characters</p>
              }
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                email
                [(ngModel)]="email"
                #emailModel="ngModel"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                [class.border-red-300]="emailModel.invalid && emailModel.touched"
              />
              @if (emailModel.invalid && emailModel.touched) {
                <p class="mt-1 text-sm text-red-600">Please enter a valid email</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minlength="6"
                [(ngModel)]="password"
                #passwordModel="ngModel"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                [class.border-red-300]="passwordModel.invalid && passwordModel.touched"
              />
              @if (passwordModel.invalid && passwordModel.touched) {
                <p class="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
              }
            </div>
          </div>

          <button
            type="submit"
            [disabled]="loading() || nameModel.invalid || emailModel.invalid || passwordModel.invalid"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (loading()) {
              <span>Creating account...</span>
            } @else {
              <span>Create account</span>
            }
          </button>

          <div class="text-center">
            <a routerLink="/auth/login" class="text-sm text-brand-600 hover:underline">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.name || !this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register(this.email, this.password, this.name).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }
}
