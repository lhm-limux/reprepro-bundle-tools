import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LiBundleInfoRefComponent } from './li-bundle-info-ref.component';

describe('LiBundleInfoRefComponent', () => {
  let component: LiBundleInfoRefComponent;
  let fixture: ComponentFixture<LiBundleInfoRefComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiBundleInfoRefComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LiBundleInfoRefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
