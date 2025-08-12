import { TestBed } from '@angular/core/testing';

import { CourierDashboard } from './courier-dashboard';

describe('CourierDashboard', () => {
  let service: CourierDashboard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourierDashboard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
