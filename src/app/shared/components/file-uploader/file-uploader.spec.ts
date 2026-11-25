import { TestBed } from '@angular/core/testing';
import { FileUploader } from './file-uploader';

/** Simula soltar un archivo sobre el recuadro */
function drop(el: HTMLElement, file: File): DragEvent {
  const event = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files: [file], types: ['Files'] } });
  el.querySelector('.drop')!.dispatchEvent(event);
  return event;
}

const image = (type = 'image/png', bytes = 1024) => new File([new Uint8Array(bytes)], 'foto.png', { type });

describe('FileUploader (modo pick)', () => {
  const setup = () => {
    const fixture = TestBed.createComponent(FileUploader);
    fixture.componentRef.setInput('mode', 'pick');
    fixture.detectChanges();
    const picked: File[] = [];
    fixture.componentInstance.picked.subscribe(f => picked.push(f));
    return { fixture, el: fixture.nativeElement as HTMLElement, picked };
  };

  it('emite la imagen válida al soltarla, sin subirla', () => {
    const { fixture, el, picked } = setup();
    const file = image();
    const event = drop(el, file);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(picked).toEqual([file]);
    expect(el.textContent).not.toContain('Subir imagen');
  });

  it('rechaza un tipo no permitido con un mensaje claro', () => {
    const { fixture, el, picked } = setup();
    drop(el, image('application/pdf'));
    fixture.detectChanges();

    expect(picked).toEqual([]);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Formato no permitido');
  });

  it('rechaza archivos de más de 5 MB', () => {
    const { fixture, el, picked } = setup();
    drop(el, image('image/png', 6 * 1024 * 1024));
    fixture.detectChanges();

    expect(picked).toEqual([]);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('El máximo es 5 MB');
  });

  it('evita que el navegador abra un archivo soltado fuera del recuadro', () => {
    setup();
    const event = new Event('drop', { cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { files: [], types: ['Files'] } });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
