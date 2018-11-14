import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { ManagedBundleInfo, ManagedBundle, WorkflowMetadata } from "shared";

@Component({
  selector: "app-managed-bundle-card",
  templateUrl: "./managed-bundle-card.component.html",
  styleUrls: ["./managed-bundle-card.component.css"]
})
export class ManagedBundleCardComponent implements OnInit {
  active: false;

  @Input()
  info: ManagedBundleInfo;

  @Input()
  candidateForStages: WorkflowMetadata[];

  @Input()
  dropStatus: WorkflowMetadata;

  @Output()
  markedForStage = new EventEmitter<{
    stage: WorkflowMetadata;
    bundles: ManagedBundle[];
  }>();

  constructor() {}
  ngOnInit() {}

  markForStage(status) {
    this.markedForStage.next({
      stage: status,
      bundles: [ this.info.managedBundle ]
    });
  }
}
