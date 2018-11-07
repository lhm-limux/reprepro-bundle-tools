import { Component, OnInit } from "@angular/core";
import { WorkflowMetadata } from "shared";
import { WorkflowMetadataService } from "./workflow-metadata.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-workflow-status-editor",
  templateUrl: "./workflow-status-editor.component.html",
  styleUrls: ["./workflow-status-editor.component.css"]
})
export class WorkflowStatusEditorComponent implements OnInit {
  workflowMetadata: WorkflowMetadata[] = [];
  highlighted: WorkflowMetadata;

  constructor(
    private workflowMetadataService: WorkflowMetadataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.workflowMetadataService.cast.subscribe(workflowMetadata => this.update(workflowMetadata));
    this.workflowMetadataService.update();
  }

  update(workflowMetadata) {
    this.workflowMetadata = workflowMetadata;
  }
}
