import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-forbidden',
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.scss',
})
export class Forbidden {
  private readonly auth = inject(AuthService);

  protected readonly homeLink = computed(() => (this.auth.isAuthenticated() ? '/dashboard' : '/'));
}
