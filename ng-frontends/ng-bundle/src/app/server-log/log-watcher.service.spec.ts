import { TestBed, inject } from '@angular/core/testing';

import { LogWatcherService } from './log-watcher.service';

describe('LogWatcherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogWatcherService]
    });
  });

  it('should be created', inject([LogWatcherService], (service: LogWatcherService) => {
    expect(service).toBeTruthy();
  }));
});
