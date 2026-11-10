import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthCard } from '../../shared/components/auth-card/auth-card';
import { GoogleButton } from '../../shared/components/google-button/google-button';
import { passwordsMatch } from '../../shared/validators/passwords-match.validator';
import { ApiError } from '../../shared/models/api.model';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthCard, GoogleButton],
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Correo al que se envió la activación; si tiene valor, se muestra el estado de éxito */
  protected readonly sentTo = signal<string | null>(null);
  protected readonly resending = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected get c() {
    return this.form.controls;
  }

  protected get mismatch(): boolean {
    return this.c.confirmPassword.touched && this.form.hasError('passwordsMismatch');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);
    const { displayName, email, password } = this.form.getRawValue();

    this.auth.register(displayName, email, password).subscribe({
      next: res => {
        this.loading.set(false);
        // Activación apagada en la API: ya hay sesión, directo al dashboard
        if (!res.requiresActivation) {
          this.toast.success(`¡Bienvenido, ${res.user.displayName}!`);
          this.router.navigateByUrl('/dashboard');
          return;
        }
        this.sentTo.set(email);
        this.toast.success('Cuenta creada. Revisa tu correo para activarla.');
      },
      error: (err: Error) => {
        this.loading.set(false);
        // Correo ya registrado: el error va en el campo email, no arriba del formulario.
        // Angular lo quita solo cuando el usuario vuelve a escribir en el campo.
        if (err instanceof ApiError && err.status === 400 && /correo/i.test(err.message)) {
          this.c.email.setErrors({ taken: true });
          this.c.email.markAsTouched();
          return;
        }
        this.serverError.set(err.message);
      },
    });
  }

  protected resend(): void {
    const email = this.sentTo();
    if (!email || this.resending()) return;

    this.resending.set(true);
    this.auth.resendActivation(email).subscribe({
      next: () => {
        this.resending.set(false);
        this.toast.success(`Enviamos un nuevo enlace a ${email}.`);
      },
      // El mensaje de error ya lo mostró el interceptor
      error: () => this.resending.set(false),
    });
  }

  /** Con Google no hay activación por correo: la API crea la cuenta (o la vincula) y regresa la sesión */
  protected registerWithGoogle(credential: string): void {
    this.loading.set(true);
    this.serverError.set(null);
    this.auth.loginWithGoogle(credential).subscribe({
      next: user => {
        this.toast.success(`¡Bienvenido, ${user.displayName}!`);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.serverError.set(err.message);
      },
    });
  }
}