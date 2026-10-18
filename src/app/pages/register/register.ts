import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthCard } from '../../shared/components/auth-card/auth-card';
import { passwordsMatch } from '../../shared/validators/passwords-match.validator';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthCard],
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Correo al que se envió la activación; si tiene valor, se muestra el estado de éxito */
  protected readonly sentTo = signal<string | null>(null);

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
      next: () => {
        this.loading.set(false);
        this.sentTo.set(email);
        this.toast.success('Cuenta creada. Revisa tu correo para activarla.');
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.serverError.set(err.message);
      },
    });
  }

  protected resend(): void {
    this.toast.info(`Reenviamos el enlace a ${this.sentTo()}.`);
  }

  protected registerWithGoogle(): void {
    this.toast.info('El registro con Google estará disponible pronto.');
  }
}