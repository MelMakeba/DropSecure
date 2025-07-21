import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sender } from './sender';

describe('Sender', () => {
  let component: Sender;
  let fixture: ComponentFixture<Sender>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sender]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sender);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
