import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthCard } from './auth-card';

describe('AuthCard', () => {
  let component: AuthCard;
  let fixture: ComponentFixture<AuthCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCard],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCard);
    // `heading` es un input requerido: hay que darle valor antes de renderizar
    fixture.componentRef.setInput('heading', 'Crea tu cuenta');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el título que recibe', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Crea tu cuenta');
  });
});