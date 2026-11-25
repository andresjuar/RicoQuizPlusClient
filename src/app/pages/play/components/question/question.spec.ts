import { TestBed } from '@angular/core/testing';
import { PublicQuestion } from '../../../../shared/models/game.model';
import { RoomSession } from '../../../../shared/services/room-session.service';
import { Question } from './question';

const QUESTION: PublicQuestion = {
  questionIndex: 0,
  totalQuestions: 3,
  question: '¿Qué planeta es este?',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/saturno.jpg',
  options: ['Marte', 'Saturno'],
  timeLimitSeconds: 20,
};

describe('Question: imagen solo para el host', () => {
  const render = (role: 'host' | 'player') => {
    TestBed.configureTestingModule({ providers: [RoomSession] });
    TestBed.inject(RoomSession).setRole(role);
    const fixture = TestBed.createComponent(Question);
    fixture.componentRef.setInput('question', QUESTION);
    fixture.componentRef.setInput('secondsLeft', 20);
    fixture.componentRef.setInput('myAnswer', null);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('el host ve la imagen de la pregunta', () => {
    expect(render('host').querySelector('img.q__image')?.getAttribute('src')).toBe(QUESTION.imageUrl);
  });

  it('el jugador no ve la imagen', () => {
    expect(render('player').querySelector('img.q__image')).toBeNull();
  });
});
