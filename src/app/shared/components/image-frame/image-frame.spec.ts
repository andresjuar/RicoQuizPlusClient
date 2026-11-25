import { TestBed } from '@angular/core/testing';
import { ImageFrame } from './image-frame';

describe('ImageFrame', () => {
  const render = (opts: { retryable?: boolean } = {}) => {
    const fixture = TestBed.createComponent(ImageFrame);
    fixture.componentRef.setInput('src', 'https://res.cloudinary.com/demo/image/upload/foto.png');
    fixture.componentRef.setInput('alt', 'Portada');
    if (opts.retryable) fixture.componentRef.setInput('retryable', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, img: () => el.querySelector('img') };
  };

  it('muestra el esqueleto mientras carga', () => {
    const { el } = render();
    expect(el.querySelector('.frame__skeleton')).not.toBeNull();
  });

  it('al cargar quita el esqueleto', () => {
    const { fixture, el, img } = render();
    img()!.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(el.querySelector('.frame__skeleton')).toBeNull();
    expect(img()!.classList.contains('is-hidden')).toBe(false);
  });

  it('si la imagen falla muestra el aviso y avisa con (failed)', () => {
    const { fixture, el, img } = render();
    let failed = false;
    fixture.componentInstance.failed.subscribe(() => (failed = true));

    img()!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(failed).toBe(true);
    expect(el.textContent).toContain('No se pudo cargar la imagen');
    expect(img()).toBeNull();
  });

  it('Reintentar vuelve a pedir la imagen con otra URL', () => {
    const { fixture, el, img } = render({ retryable: true });
    img()!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    (el.querySelector('.frame__retry') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(img()!.getAttribute('src')).toContain('retry=1');
  });
});
