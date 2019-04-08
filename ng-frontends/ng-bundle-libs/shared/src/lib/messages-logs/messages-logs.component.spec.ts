import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesLogsComponent } from './messages-logs.component';

describe('MessagesLogsComponent', () => {
  let component: MessagesLogsComponent;
  let fixture: ComponentFixture<MessagesLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessagesLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
