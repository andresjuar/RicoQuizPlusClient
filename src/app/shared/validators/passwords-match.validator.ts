import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Se aplica al FormGroup: compara password y confirmPassword. */
export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};