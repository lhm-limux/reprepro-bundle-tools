import { TestBed } from "@angular/core/testing";

import { WorkflowMetadataService } from "./workflow-metadata.service";

describe("WorkflowMetadataService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: WorkflowMetadataService = TestBed.get(
      WorkflowMetadataService
    );
    expect(service).toBeTruthy();
  });
});
