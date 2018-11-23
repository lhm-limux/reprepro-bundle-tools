import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ManagedBundleEditorComponent } from "./managed-bundle-editor.component";

describe("ManagedBundleEditorComponent", () => {
  let component: ManagedBundleEditorComponent;
  let fixture: ComponentFixture<ManagedBundleEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ManagedBundleEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagedBundleEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
