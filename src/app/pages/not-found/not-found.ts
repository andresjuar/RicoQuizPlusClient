import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private readonly auth = inject(AuthService);
  protected readonly url = inject(Router).url;
  protected readonly revealed = signal(false);
  protected readonly icons = ['▲', '◆', '●', '■'];

  /** Las tres primeras navegan; la cuarta es la "respuesta correcta" */
  protected readonly options = computed(() => {
    const logged = this.auth.isAuthenticated();
    return [
      { label: 'En el inicio', link: logged ? '/dashboard' : '/' },
      { label: 'Explorando quizzes', link: '/explore' },
      logged
        ? { label: 'En mis quizzes', link: '/quizzes/mine' }
        : { label: 'Iniciando sesión', link: '/login' },
      { label: 'Nunca existió', link: null },
    ];
  });

  protected readonly homeLink = computed(() => (this.auth.isAuthenticated() ? '/dashboard' : '/'));
}