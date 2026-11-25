import { TestBed } from '@angular/core/testing';
import { RoomQr } from './room-qr';

describe('RoomQr', () => {
  const render = async (url: string) => {
    const fixture = TestBed.createComponent(RoomQr);
    fixture.componentRef.setInput('url', url);
    fixture.detectChanges();
    await fixture.whenStable();
    // toDataURL es asíncrono: espera a que termine y vuelve a pintar
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });
    return fixture.nativeElement as HTMLElement;
  };

  it('pinta el QR como imagen PNG con el link en el texto alternativo', async () => {
    const el = await render('http://localhost:4200/play/QWER');
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(img.getAttribute('alt')).toContain('/play/QWER');
  });
});
