import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackPackage } from './track-package';

describe('TrackPackage', () => {
  let component: TrackPackage;
  let fixture: ComponentFixture<TrackPackage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackPackage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackPackage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
