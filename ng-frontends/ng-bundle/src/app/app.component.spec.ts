import { BundleListComponent } from "./bundle-list/bundle-list.component";
import { TestBed, async } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { SelectFilterComponent } from "shared";
import { BundleListService } from "./bundle-list/bundle-list.service";
import { MockBundleListService } from "./test/mock-bundle-list-service.class";

describe("AppComponent", () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent, BundleListComponent, SelectFilterComponent],
      providers: [
        { provide: BundleListService, useClass: MockBundleListService }
      ]
    }).compileComponents();
  }));

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'ng-bundle'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual("ng-bundle");
  });

  it("should render title in a h1 tag", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector("h1").textContent).toContain(
      "Bundle-Tool"
    );
  });
});
