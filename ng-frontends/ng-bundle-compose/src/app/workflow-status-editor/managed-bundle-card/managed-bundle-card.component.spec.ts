import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagedBundleCardComponent } from './managed-bundle-card.component';

describe('ManagedBundleCardComponent', () => {
  let component: ManagedBundleCardComponent;
  let fixture: ComponentFixture<ManagedBundleCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagedBundleCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagedBundleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
