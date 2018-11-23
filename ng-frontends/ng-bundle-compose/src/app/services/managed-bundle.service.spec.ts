import { TestBed } from '@angular/core/testing';

import { ManagedBundleService } from './managed-bundle.service';

describe('ManagedBundleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ManagedBundleService = TestBed.get(ManagedBundleService);
    expect(service).toBeTruthy();
  });
});
