import { TestBed } from '@angular/core/testing';

import { VersionedChangesService } from './versioned-changes.service';

describe('VersionedChangesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VersionedChangesService = TestBed.get(VersionedChangesService);
    expect(service).toBeTruthy();
  });
});
