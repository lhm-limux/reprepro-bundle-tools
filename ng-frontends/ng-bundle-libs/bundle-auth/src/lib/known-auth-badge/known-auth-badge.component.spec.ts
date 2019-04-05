import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KnownAuthBadgeComponent } from './known-auth-badge.component';

describe('KnownAuthBadgeComponent', () => {
  let component: KnownAuthBadgeComponent;
  let fixture: ComponentFixture<KnownAuthBadgeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KnownAuthBadgeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnownAuthBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
