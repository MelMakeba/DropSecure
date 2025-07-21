import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageStatusTimeline } from './package-status-timeline';

describe('PackageStatusTimeline', () => {
  let component: PackageStatusTimeline;
  let fixture: ComponentFixture<PackageStatusTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageStatusTimeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageStatusTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
