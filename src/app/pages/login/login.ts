import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthCard } from '../../shared/components/auth-card/auth-card';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthCard],
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
      next: user => {
        this.toast.success(`¡Hola de nuevo, ${user.displayName}!`);
        this.router.navigateByUrl(this.returnUrl() ?? '/dashboard');
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.serverError.set(err.message);
      },
    });
  }

  // TODO Issue 7: Google Identity Services
  protected loginWithGoogle(): void {
    this.toast.info('El inicio de sesión con Google estará disponible pronto.');
  }
}