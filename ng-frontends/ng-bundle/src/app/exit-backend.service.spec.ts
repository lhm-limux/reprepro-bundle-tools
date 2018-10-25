import { TestBed } from '@angular/core/testing';

import { ExitBackendService } from './exit-backend.service';

describe('ExitBackendService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExitBackendService = TestBed.get(ExitBackendService);
    expect(service).toBeTruthy();
  });
});
