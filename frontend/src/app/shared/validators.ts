import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PHONE_PATTERN = /^[0-9+\- ]{6,20}$/;
export const NAME_PATTERN = /^[\p{L} .'-]+$/u;

/** Group validator: the two named controls must hold the same value. */
export function matchFields(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const v1 = group.get(a)?.value;
    const v2 = group.get(b)?.value;
    return v1 && v2 && v1 !== v2 ? { mismatch: true } : null;
  };
}
