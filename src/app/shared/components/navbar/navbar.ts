import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Avatar } from '../avatar/avatar';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Avatar],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);  protected readonly menuOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected closeMenus(): void {
    this.menuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  protected logout(): void {
    this.closeMenus();
    this.confirm.confirm({
      title: '¿Cerrar sesión?',
       message: 'Tendrás que iniciar sesión de nuevo para crear quizzes o ver tu historial.',
       confirmText: 'Cerrar sesión',
       variant: 'danger',
     }).subscribe(ok => {
       if (!ok) return;
       this.auth.logout();
       this.toast.success('Cerraste sesión correctamente.');
     });
  }
}