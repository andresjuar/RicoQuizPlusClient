import { TestBed } from '@angular/core/testing';
import { AnswerStorageService } from './answer-storage.service';

describe('AnswerStorageService', () => {
  let store: AnswerStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    store = TestBed.inject(AnswerStorageService);
  });

  it('recupera la respuesta de la misma sala y pregunta', () => {
    store.save('QWER', 2, 3);
    expect(store.get('QWER', 2)).toBe(3);
  });

  it('no regresa la respuesta de otra pregunta u otra sala', () => {
    store.save('QWER', 2, 3);
    expect(store.get('QWER', 3)).toBeNull();
    expect(store.get('ABCD', 2)).toBeNull();
  });

  it('guarda una sola respuesta a la vez', () => {
    store.save('QWER', 1, 0);
    store.save('QWER', 2, 1);
    expect(store.get('QWER', 1)).toBeNull();
    expect(store.get('QWER', 2)).toBe(1);
  });

  it('clear() no deja nada en sessionStorage', () => {
    store.save('QWER', 2, 3);
    store.clear();
    expect(store.get('QWER', 2)).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('ignora datos corruptos', () => {
    sessionStorage.setItem('rq_answer', '{no es json');
    expect(store.get('QWER', 2)).toBeNull();
  });
});
