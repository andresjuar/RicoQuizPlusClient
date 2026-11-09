import { Directive, TemplateRef, ViewContainerRef, effect, inject, input, untracked } from '@angular/core';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Muestra el bloque solo si el rol de la app coincide: `*appHasRole="'user'"` o `*appHasRole="['invitado']"`.
 * Lee auth.role(), así que se actualiza al iniciar o cerrar sesión sin recargar.
 */
@Directive({
  selector: '[appHasRole]',
})
export class HasRole {
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  readonly appHasRole = input.required<UserRole | UserRole[]>();

  constructor() {
    effect(() => {
      const roles = this.appHasRole();
      const allowed = this.auth.hasRole(...(Array.isArray(roles) ? roles : [roles]));

      untracked(() => {
        if (allowed && !this.hasView) {
          this.viewContainer.createEmbeddedView(this.template);
          this.hasView = true;
        } else if (!allowed && this.hasView) {
          this.viewContainer.clear();
          this.hasView = false;
        }
      });
    });
  }
}
