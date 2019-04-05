import { TestBed } from '@angular/core/testing';

import { BundleAuthService } from './bundle-auth.service';

describe('BundleAuthService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BundleAuthService = TestBed.get(BundleAuthService);
    expect(service).toBeTruthy();
  });
});
