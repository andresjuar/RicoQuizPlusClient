import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CATEGORIES } from '../../models/categories';

@Component({
  imports: [],
  selector: 'app-topic-picker',
  templateUrl: './topic-picker.html',
  styleUrl: './topic-picker.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TopicPicker), multi: true }],
})
export class TopicPicker implements ControlValueAccessor {
  protected readonly categories = CATEGORIES;
  protected readonly value = signal('');
  protected readonly custom = signal(false);
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  // --- ControlValueAccessor ---
  writeValue(value: string | null): void {
    const v = value ?? '';
    this.value.set(v);
    this.custom.set(!!v && !CATEGORIES.some(c => c.id === v));
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled.set(disabled); }

  // --- UI ---
  protected select(id: string): void {
    this.custom.set(false);
    this.update(id);
  }

  protected chooseCustom(): void {
    this.custom.set(true);
    this.update('');
  }

  protected onCustomInput(text: string): void {
    this.update(text);
  }

  private update(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}