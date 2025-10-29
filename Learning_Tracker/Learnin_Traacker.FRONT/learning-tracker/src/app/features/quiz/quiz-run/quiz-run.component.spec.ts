import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizRunComponent } from './quiz-run.component';

describe('QuizRunComponent', () => {
  let component: QuizRunComponent;
  let fixture: ComponentFixture<QuizRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizRunComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
