import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleSearchComponent } from './bundle-search.component';

describe('BundleSearchComponent', () => {
  let component: BundleSearchComponent;
  let fixture: ComponentFixture<BundleSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BundleSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BundleSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
