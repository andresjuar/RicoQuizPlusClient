import { Component, input } from '@angular/core';

@Component({
  selector: 'app-countdown-timer',
  styleUrl: './countdown-timer.scss',
  templateUrl: './countdown-timer.html',
})
export class CountdownTimer {
  readonly seconds = input.required<number>();
}