import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthCard } from '../../shared/components/auth-card/auth-card';

type ActivationState = 'verifying' | 'success' | 'invalid';

@Component({
  selector: 'app-activate',
  imports: [ReactiveFormsModule, RouterLink, AuthCard],
  templateUrl: './activate.html',
  styleUrl: './activate.scss',
})
export class Activate implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  /** :token de la ruta */
  readonly token = input.required<string>();

  protected readonly state = signal<ActivationState>('verifying');
  protected readonly resending = signal(false);

  protected readonly resendForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly copy: Record<ActivationState, { heading: string; subtitle: string }> = {
    verifying: {  heading: 'Activando tu cuenta…', subtitle: 'Estamos verificando tu enlace.' },
    success:   {  heading: '¡Cuenta activada!', subtitle: 'Ya puedes iniciar sesión y crear tu primer quiz.' },
    invalid:   {  heading: 'Enlace no válido', subtitle: 'El enlace es inválido o ya expiró. Pide uno nuevo.' },
  };

  ngOnInit(): void {
    // Los inputs de ruta ya están disponibles aquí, no en el constructor
    this.auth.activate(this.token()).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('invalid'),
    });
  }

  protected resend(): void {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    this.resending.set(true);
    const { email } = this.resendForm.getRawValue();

    this.auth.resendActivation(email).subscribe(() => {
      this.resending.set(false);
      this.resendForm.reset();
      this.toast.success(`Enviamos un nuevo enlace a ${email}.`);
    });
  }
}