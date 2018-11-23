import { TestBed } from '@angular/core/testing';

import { BundleComposeActionService } from './bundle-compose-action.service';

describe('BundleComposeActionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BundleComposeActionService = TestBed.get(BundleComposeActionService);
    expect(service).toBeTruthy();
  });
});
