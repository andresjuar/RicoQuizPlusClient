import { Component, input, output } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';

// El backend exige 2–30 caracteres sin contar espacios en los extremos
function guestName(control: AbstractControl<string>): ValidationErrors | null {
  const len = control.value.trim().length;
  return len >= 2 && len <= 30 ? null : { guestName: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-guest-gate',
  styleUrl: './guest-gate.scss',
  templateUrl: './guest-gate.html',
})
export class GuestGate {
  readonly code = input.required<string>();
  readonly joined = output<string>();

  protected readonly name = new FormControl('', { nonNullable: true, validators: [guestName] });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.name.invalid) {
      this.name.markAsTouched();
      return;
    }
    this.joined.emit(this.name.value.trim());
  }
}