import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionEditor, createQuestionForm } from './question-editor';

describe('QuestionEditor', () => {
  let component: QuestionEditor;
  let fixture: ComponentFixture<QuestionEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionEditor);
    // `form`, `index` y `total` son inputs requeridos: hay que darles valor antes de renderizar
    fixture.componentRef.setInput('form', createQuestionForm());
    fixture.componentRef.setInput('index', 0);
    fixture.componentRef.setInput('total', 1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con 4 opciones vacías y sin respuesta correcta', () => {
    const form = component.form();
    expect(form.controls.options.length).toBe(4);
    expect(form.controls.correctIndex.value).toBeNull();
  });
});