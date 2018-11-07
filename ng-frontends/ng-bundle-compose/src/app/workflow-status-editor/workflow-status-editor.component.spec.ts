import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { WorkflowStatusEditorComponent } from "./workflow-status-editor.component";

describe("WorkflowStatusEditorComponent", () => {
  let component: WorkflowStatusEditorComponent;
  let fixture: ComponentFixture<WorkflowStatusEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WorkflowStatusEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowStatusEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
