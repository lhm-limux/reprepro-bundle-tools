import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnpublishedChangesComponent } from './unpublished-changes.component';

describe('UnpublishedChangesComponent', () => {
  let component: UnpublishedChangesComponent;
  let fixture: ComponentFixture<UnpublishedChangesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnpublishedChangesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnpublishedChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
