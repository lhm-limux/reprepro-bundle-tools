import { TestBed } from '@angular/core/testing';

import { BundleDialogService } from './bundle-dialog.service';

describe('BundleDialogService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BundleDialogService = TestBed.get(BundleDialogService);
    expect(service).toBeTruthy();
  });
});
