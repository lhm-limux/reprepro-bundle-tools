import { TestBed } from '@angular/core/testing';

import { BundleMetadataService } from './bundle-metadata.service';

describe('BundleMetadataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BundleMetadataService = TestBed.get(BundleMetadataService);
    expect(service).toBeTruthy();
  });
});
