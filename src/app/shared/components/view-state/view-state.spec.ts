import { Component, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../models/api.model';
import { ViewState } from './view-state';

@Component({
  imports: [ViewState],
  template: `
    <app-view-state #vs [resource]="items" emptyTitle="Sin quizzes" />
    @if (vs.isReady()) {
      <p class="ready">{{ items.value()!.length }} elementos</p>
    }
  `,
})
class Host {
  readonly source = signal<Observable<string[]>>(NEVER);
  readonly items = rxResource({ stream: () => this.source() });
}

async function render(source: Observable<string[]>) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.source.set(source);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ViewState', () => {
  it('muestra el skeleton mientras carga', () => {
    // NEVER no emite: el resource se queda cargando (no se espera whenStable)
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('muestra el estado vacío cuando la lista no trae elementos', async () => {
    const el = await render(of([]));
    expect(el.textContent).toContain('Sin quizzes');
    expect(el.querySelector('.ready')).toBeNull();
  });

  it('muestra el mensaje del ApiError y el botón de reintentar', async () => {
    const el = await render(throwError(() => new ApiError('Quiz no encontrado', 404)));
    expect(el.textContent).toContain('Quiz no encontrado');
    expect(el.querySelector('button')?.textContent).toContain('Reintentar');
  });

  it('deja que la página pinte el contenido cuando hay datos', async () => {
    const el = await render(of(['a', 'b']));
    expect(el.querySelector('.ready')?.textContent).toContain('2 elementos');
  });
});
