import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FontawsomeToggleButtonComponent } from './fontawsome-toggle-button.component';

describe('FontawsomeToggleButtonComponent', () => {
  let component: FontawsomeToggleButtonComponent;
  let fixture: ComponentFixture<FontawsomeToggleButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FontawsomeToggleButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FontawsomeToggleButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
