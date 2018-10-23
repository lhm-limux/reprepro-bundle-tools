import { TestBed } from "@angular/core/testing";

import { BundleListService } from "./bundle-list.service";
import { HttpClientModule } from "@angular/common/http";

describe("BundleListService", () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientModule] // should be replaced by HttpClientTestingModule
  }));

  it("should be created", () => {
    const service: BundleListService = TestBed.get(BundleListService);
    expect(service).toBeTruthy();
  });
});
