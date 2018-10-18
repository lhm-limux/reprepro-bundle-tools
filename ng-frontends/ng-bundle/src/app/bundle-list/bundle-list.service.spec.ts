import { TestBed } from '@angular/core/testing';

import { BundleListService } from './bundle-list.service';

describe('BundleListService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BundleListService = TestBed.get(BundleListService);
    expect(service).toBeTruthy();
  });
});
