import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageDetailModal } from './package-detail-modal';

describe('PackageDetailModal', () => {
  let component: PackageDetailModal;
  let fixture: ComponentFixture<PackageDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
