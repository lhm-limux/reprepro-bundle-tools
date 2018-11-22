import {
  WorkflowMetadata,
  ManagedBundleInfo,
  ManagedBundle,
  FontawsomeToggleButtonComponent
} from "shared";
import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-workflow-status-card",
  templateUrl: "./workflow-status-card.component.html",
  styleUrls: ["./workflow-status-card.component.css"]
})
export class WorkflowStatusCardComponent {
  @Input()
  cardFormat: string;

  @Input()
  status: WorkflowMetadata;

  @Input()
  validStage: boolean;

  @Input()
  showContent: boolean;

  @Input()
  managedBundleInfos: ManagedBundleInfo[];

  @Input()
  candidateForStages: WorkflowMetadata[];

  @Input()
  dropStatus: WorkflowMetadata;

  @Output()
  markedForStage = new EventEmitter<{
    stage: WorkflowMetadata;
    bundles: ManagedBundle[];
  }>();

  active = false;

  constructor() {}

  doMarkedForStage(event) {
    this.markedForStage.next(event);
  }

  markForStage(newStatus) {
    this.markedForStage.next({
      stage: newStatus,
      bundles: this.managedBundleInfos.map(i => i.managedBundle)
    });
  }
}
