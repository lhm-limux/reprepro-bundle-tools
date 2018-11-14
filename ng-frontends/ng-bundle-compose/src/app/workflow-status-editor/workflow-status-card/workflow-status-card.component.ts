import { WorkflowMetadata, ManagedBundleInfo } from "shared";
import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "app-workflow-status-card",
  templateUrl: "./workflow-status-card.component.html",
  styleUrls: ["./workflow-status-card.component.css"]
})
export class WorkflowStatusCardComponent implements OnInit {
  @Input()
  cardFormat: string;

  @Input()
  status: WorkflowMetadata;

  @Input()
  validStage: boolean;

  @Input()
  managedBundleInfos: ManagedBundleInfo[];

  @Input()
  candidateForStages: WorkflowMetadata[];

  @Input()
  dropStatus: WorkflowMetadata;

  active = false;

  constructor() {}

  ngOnInit() {}

  markForStage(status) {

  }
}
