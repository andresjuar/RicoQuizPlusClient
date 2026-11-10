import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RoomSession } from '../services/room-session.service';
import { IsHost } from './is-host';
import { IsPlayer } from './is-player';

@Component({
  imports: [IsHost, IsPlayer],
  providers: [RoomSession],
  template: `
    <span class="shape">▲</span>
    <span *appIsHost class="option-text">París</span>
    <p *appIsPlayer class="look-up">Mira la pantalla del host</p>
  `,
})
class InRoom {
  readonly room = inject(RoomSession);
}

@Component({
  imports: [IsHost, IsPlayer],
  template: `
    <span *appIsHost class="option-text">París</span>
    <p *appIsPlayer class="look-up">Mira la pantalla del host</p>
  `,
})
class OutsideRoom {}

describe('IsHost / IsPlayer', () => {
  const count = (el: HTMLElement, selector: string) => el.querySelectorAll(selector).length;

  const renderInRoom = () => {
    const fixture = TestBed.createComponent(InRoom);
    fixture.detectChanges();
    return fixture;
  };

  it('no muestra ninguno mientras el servidor no asigna rol', () => {
    const el: HTMLElement = renderInRoom().nativeElement;
    expect(count(el, '.option-text')).toBe(0);
    expect(count(el, '.look-up')).toBe(0);
    expect(count(el, '.shape')).toBe(1);
  });

  it('el host ve el texto de la opción y no el aviso de jugador', () => {
    const fixture = renderInRoom();
    fixture.componentInstance.room.setRole('host');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(count(el, '.option-text')).toBe(1);
    expect(count(el, '.look-up')).toBe(0);
  });

  it('el jugador solo ve la forma, no el texto de la opción', () => {
    const fixture = renderInRoom();
    fixture.componentInstance.room.setRole('player');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(count(el, '.option-text')).toBe(0);
    expect(count(el, '.look-up')).toBe(1);
    expect(count(el, '.shape')).toBe(1);
  });

  it('se actualiza si el host cambia sin duplicar vistas', () => {
    const fixture = renderInRoom();
    const { room } = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;

    for (const role of ['host', 'player', 'host'] as const) {
      room.setRole(role);
      fixture.detectChanges();
    }

    expect(count(el, '.option-text')).toBe(1);
    expect(count(el, '.look-up')).toBe(0);
  });

  it('fuera de una sala (sin RoomSession) no muestra ninguno', () => {
    const fixture = TestBed.createComponent(OutsideRoom);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(count(el, '.option-text')).toBe(0);
    expect(count(el, '.look-up')).toBe(0);
  });
});
