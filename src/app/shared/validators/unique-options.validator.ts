import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/**
 * Se aplica al FormArray de opciones de una pregunta: marca error si dos opciones
 * escritas son iguales (ignora mayúsculas, acentos y espacios). Las vacías no cuentan;
 * de esas se encarga Validators.required en cada opción.
 *
 * Error: { duplicateOptions: { indexes: [1, 3] } } con las posiciones repetidas.
 */
export const uniqueOptions: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!(control instanceof FormArray)) return null;

  const seen = new Map<string, number>();
  const indexes = new Set<number>();

  (control.value as string[]).forEach((value, i) => {
    const key = normalize(value ?? '');
    if (!key) return;
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, i);
    } else {
      indexes.add(first).add(i);
    }
  });

  return indexes.size ? { duplicateOptions: { indexes: [...indexes].sort((a, b) => a - b) } } : null;
};
