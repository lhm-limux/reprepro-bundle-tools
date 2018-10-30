import { SelectFilterComponent } from "./../select-filter/select-filter.component";
import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BundleListComponent } from "./bundle-list.component";
import { Bundle } from "shared/bundle";
import { BehaviorSubject } from "rxjs";
import { BundleListService } from "./bundle-list.service";
import { MockBundleListService } from "../test/mock-bundle-list-service.class";

describe("BundleListComponent", () => {
  let component: BundleListComponent;
  let fixture: ComponentFixture<BundleListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BundleListComponent, SelectFilterComponent],
      providers: [
        { provide: BundleListService, useClass: MockBundleListService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BundleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
