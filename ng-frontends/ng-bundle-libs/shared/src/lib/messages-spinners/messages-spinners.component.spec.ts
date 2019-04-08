import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesSpinnersComponent } from './messages-spinners.component';

describe('MessagesSpinnersComponent', () => {
  let component: MessagesSpinnersComponent;
  let fixture: ComponentFixture<MessagesSpinnersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessagesSpinnersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesSpinnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
