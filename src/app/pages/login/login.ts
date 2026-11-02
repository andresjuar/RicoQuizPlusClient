import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthCard } from '../../shared/components/auth-card/auth-card';
import { GoogleButton } from '../../shared/components/google-button/google-button';
import { User } from '../../shared/models/user.model';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthCard, GoogleButton],
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** ?returnUrl=... que agrega el authGuard (llega por withComponentInputBinding) */
  readonly returnUrl = input<string>();

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: user => this.welcome(user),
      error: (err: Error) => this.fail(err),
    });
  }

  /** El botón de Google ya autenticó al usuario con Google; ahora la API crea o vincula la cuenta */
  protected loginWithGoogle(credential: string): void {
    this.loading.set(true);
    this.serverError.set(null);
    this.auth.loginWithGoogle(credential).subscribe({
      next: user => this.welcome(user),
      error: (err: Error) => this.fail(err),
    });
  }

  private welcome(user: User): void {
    this.toast.success(`¡Hola de nuevo, ${user.displayName}!`);
    this.router.navigateByUrl(this.returnUrl() ?? '/dashboard');
  }

  private fail(err: Error): void {
    this.loading.set(false);
    this.serverError.set(err.message);
  }
}