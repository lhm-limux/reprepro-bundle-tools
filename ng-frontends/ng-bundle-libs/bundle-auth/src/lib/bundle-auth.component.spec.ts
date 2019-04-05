import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleAuthComponent } from './bundle-auth.component';

describe('BundleAuthComponent', () => {
  let component: BundleAuthComponent;
  let fixture: ComponentFixture<BundleAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BundleAuthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BundleAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
