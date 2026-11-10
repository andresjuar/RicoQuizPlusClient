import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchRow } from './match-row';
import { MatchHistoryItem } from '../../models/match.model';

const MATCH: MatchHistoryItem = {
  matchId: '1',
  quizTitle: 'Quiz de Ciencia',
  playedAt: '2026-10-28T20:00:00Z',
  score: 4200,
  rank: 1,
  totalPlayers: 5,
};

describe('MatchRow', () => {
  let component: MatchRow;
  let fixture: ComponentFixture<MatchRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRow],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchRow);
    // `match` es un input requerido: hay que darle valor antes de renderizar
    fixture.componentRef.setInput('match', MATCH);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el título y la medalla del primer lugar', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Quiz de Ciencia');
    expect(text).toContain('🥇');
  });

  it('fuera del podio muestra el lugar como #N', async () => {
    fixture.componentRef.setInput('match', { ...MATCH, rank: 5 });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('#5');
  });
});