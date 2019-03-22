import { TestBed } from '@angular/core/testing';

import { BundleInfosService } from './bundle-infos.service';

describe('BundleInfosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BundleInfosService = TestBed.get(BundleInfosService);
    expect(service).toBeTruthy();
  });
});
