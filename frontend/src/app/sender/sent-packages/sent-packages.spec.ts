import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentPackages } from './sent-packages';

describe('SentPackages', () => {
  let component: SentPackages;
  let fixture: ComponentFixture<SentPackages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentPackages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SentPackages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
