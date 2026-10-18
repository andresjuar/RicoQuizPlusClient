import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopicPicker } from './topic-picker';

describe('TopicPicker', () => {
  let component: TopicPicker;
  let fixture: ComponentFixture<TopicPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
