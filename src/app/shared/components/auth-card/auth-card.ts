import { Component, input } from '@angular/core'

@Component({
  imports: [],
  selector: 'app-auth-card',
  styleUrl: './auth-card.scss',
  templateUrl: './auth-card.html'
})
export class AuthCard {
  readonly heading = input.required<string>()
  readonly subtitle = input<string>()
}
