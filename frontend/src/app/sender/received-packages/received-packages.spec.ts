import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivedPackages } from './received-packages';

describe('ReceivedPackages', () => {
  let component: ReceivedPackages;
  let fixture: ComponentFixture<ReceivedPackages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedPackages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceivedPackages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
