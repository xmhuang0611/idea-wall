import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncubatorReviewFormComponent } from './incubator-review-form.component';

describe('IncubatorReviewFormComponent', () => {
  let component: IncubatorReviewFormComponent;
  let fixture: ComponentFixture<IncubatorReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncubatorReviewFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncubatorReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
