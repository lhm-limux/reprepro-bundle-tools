import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleInfoCardComponent } from './bundle-info-card.component';

describe('BundleInfoCardComponent', () => {
  let component: BundleInfoCardComponent;
  let fixture: ComponentFixture<BundleInfoCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BundleInfoCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BundleInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
