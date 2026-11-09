import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { HasRole } from './has-role';

@Component({
  imports: [HasRole],
  template: `
    <p *appHasRole="'user'" class="for-user">Mis quizzes</p>
    <p *appHasRole="['invitado']" class="for-guest">Iniciar sesión</p>
  `,
})
class Host {}

describe('HasRole', () => {
  const role = signal<UserRole>('invitado');
  const fakeAuth = {
    role,
    hasRole: (...roles: UserRole[]) => roles.includes(role()),
  };

  const render = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  };
  const query = (el: HTMLElement, selector: string) => el.querySelectorAll(selector).length;

  beforeEach(() => {
    role.set('invitado');
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: fakeAuth }] });
  });

  it('muestra el bloque cuando el rol está permitido', () => {
    role.set('user');
    const el: HTMLElement = render().nativeElement;
    expect(query(el, '.for-user')).toBe(1);
  });

  it('no muestra el bloque cuando el rol no está permitido', () => {
    const el: HTMLElement = render().nativeElement;
    expect(query(el, '.for-user')).toBe(0);
    expect(query(el, '.for-guest')).toBe(1);
  });

  it('se actualiza al cambiar el rol sin recrear el componente ni duplicar la vista', () => {
    const fixture = render();
    const host = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;

    role.set('user');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBe(host);
    expect(query(el, '.for-user')).toBe(1);
    expect(query(el, '.for-guest')).toBe(0);

    role.set('user');
    fixture.detectChanges();
    expect(query(el, '.for-user')).toBe(1);

    role.set('invitado');
    fixture.detectChanges();
    expect(query(el, '.for-user')).toBe(0);
    expect(query(el, '.for-guest')).toBe(1);
  });
});
