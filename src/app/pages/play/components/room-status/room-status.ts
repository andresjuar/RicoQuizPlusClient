import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-room-status',
  styleUrl: './room-status.scss',
  templateUrl: './room-status.html',
})
export class RoomStatus {
  readonly kind = input.required<'connecting' | 'error'>();
  readonly message = input<string>();

  readonly retry = output<void>();
}