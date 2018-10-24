import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleEditComponent } from './bundle-edit.component';

describe('BundleEditComponent', () => {
  let component: BundleEditComponent;
  let fixture: ComponentFixture<BundleEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BundleEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BundleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
