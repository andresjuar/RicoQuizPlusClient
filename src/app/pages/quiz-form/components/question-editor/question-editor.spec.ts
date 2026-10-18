import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionEditor } from './question-editor';

describe('QuestionEditor', () => {
  let component: QuestionEditor;
  let fixture: ComponentFixture<QuestionEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
