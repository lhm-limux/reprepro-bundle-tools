import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraAuthModalComponent } from './extra-auth-modal.component';

describe('ExtraAuthModalComponent', () => {
  let component: ExtraAuthModalComponent;
  let fixture: ComponentFixture<ExtraAuthModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtraAuthModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtraAuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
