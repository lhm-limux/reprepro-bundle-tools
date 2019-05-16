import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AptReposSearchComponent } from './apt-repos-search.component';

describe('AptReposSearchComponent', () => {
  let component: AptReposSearchComponent;
  let fixture: ComponentFixture<AptReposSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AptReposSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AptReposSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
