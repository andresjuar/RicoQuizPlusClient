import { FormArray, FormControl } from '@angular/forms';
import { uniqueOptions } from './unique-options.validator';

const options = (...values: string[]) =>
  new FormArray(values.map(v => new FormControl(v, { nonNullable: true })), { validators: uniqueOptions });

describe('uniqueOptions', () => {
  it('es válido cuando todas las opciones son distintas', () => {
    expect(options('París', 'Roma', 'Madrid').errors).toBeNull();
  });

  it('detecta repetidas sin importar mayúsculas, acentos ni espacios', () => {
    expect(options('París', 'Roma', '  paris ').errors).toEqual({ duplicateOptions: { indexes: [0, 2] } });
  });

  it('ignora las opciones vacías (eso lo valida required)', () => {
    expect(options('París', '', '').errors).toBeNull();
  });

  it('se recalcula cuando el usuario corrige una opción', () => {
    const array = options('Roma', 'Roma');
    expect(array.hasError('duplicateOptions')).toBe(true);
    array.at(1).setValue('Madrid');
    expect(array.hasError('duplicateOptions')).toBe(false);
  });
});
