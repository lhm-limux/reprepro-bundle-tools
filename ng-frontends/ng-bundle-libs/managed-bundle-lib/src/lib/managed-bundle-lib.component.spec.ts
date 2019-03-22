import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagedBundleLibComponent } from './managed-bundle-lib.component';

describe('ManagedBundleLibComponent', () => {
  let component: ManagedBundleLibComponent;
  let fixture: ComponentFixture<ManagedBundleLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagedBundleLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagedBundleLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
