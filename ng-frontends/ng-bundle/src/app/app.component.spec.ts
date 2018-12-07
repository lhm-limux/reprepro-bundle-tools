/***********************************************************************
* Copyright (c) 2018 Landeshauptstadt München
*           (c) 2018 Christoph Lutz (InterFace AG)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the European Union Public Licence (EUPL),
* version 1.1 (or any later version).
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* European Union Public Licence for more details.
*
* You should have received a copy of the European Union Public Licence
* along with this program. If not, see
* https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
***********************************************************************/

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
