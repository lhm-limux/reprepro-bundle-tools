import { TestBed } from '@angular/core/testing';

import { BackendRegisterService } from './backend-register.service';

describe('BackendRegisterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackendRegisterService = TestBed.get(BackendRegisterService);
    expect(service).toBeTruthy();
  });
});
