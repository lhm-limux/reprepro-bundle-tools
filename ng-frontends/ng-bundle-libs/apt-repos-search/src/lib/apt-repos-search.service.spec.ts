import { TestBed } from '@angular/core/testing';

import { AptReposSearchService } from './apt-repos-search.service';

describe('AptReposSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AptReposSearchService = TestBed.get(AptReposSearchService);
    expect(service).toBeTruthy();
  });
});
