import { TestBed } from '@angular/core/testing';

import { SenderDashboard } from './sender-dashboard';

describe('SenderDashboard', () => {
  let service: SenderDashboard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SenderDashboard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
