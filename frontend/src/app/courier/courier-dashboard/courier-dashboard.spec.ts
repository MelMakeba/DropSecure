import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourierDashboard } from './courier-dashboard';

describe('CourierDashboard', () => {
  let component: CourierDashboard;
  let fixture: ComponentFixture<CourierDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourierDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourierDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
