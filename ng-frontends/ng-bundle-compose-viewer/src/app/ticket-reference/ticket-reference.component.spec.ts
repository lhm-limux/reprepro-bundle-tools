import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketReferenceComponent } from './ticket-reference.component';

describe('TicketReferenceComponent', () => {
  let component: TicketReferenceComponent;
  let fixture: ComponentFixture<TicketReferenceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TicketReferenceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketReferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
