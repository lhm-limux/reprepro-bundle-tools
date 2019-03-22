import { TestBed } from '@angular/core/testing';

import { ManagedBundleLibService } from './managed-bundle-lib.service';

describe('ManagedBundleLibService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ManagedBundleLibService = TestBed.get(ManagedBundleLibService);
    expect(service).toBeTruthy();
  });
});
