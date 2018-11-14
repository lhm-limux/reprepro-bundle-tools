import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowStatusCardComponent } from './workflow-status-card.component';

describe('WorkflowStatusCardComponent', () => {
  let component: WorkflowStatusCardComponent;
  let fixture: ComponentFixture<WorkflowStatusCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowStatusCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowStatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
