import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchRow } from './match-row';

describe('MatchRow', () => {
  let component: MatchRow;
  let fixture: ComponentFixture<MatchRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRow],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
