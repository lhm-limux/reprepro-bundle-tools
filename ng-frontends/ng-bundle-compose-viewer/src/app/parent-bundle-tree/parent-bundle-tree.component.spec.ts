import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentBundleTreeComponent } from './parent-bundle-tree.component';

describe('ParentBundleTreeComponent', () => {
  let component: ParentBundleTreeComponent;
  let fixture: ComponentFixture<ParentBundleTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParentBundleTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentBundleTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
