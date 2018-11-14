import { Component, OnInit, Input } from "@angular/core";
import { ManagedBundleInfo, ManagedBundle, WorkflowMetadata } from "shared";

@Component({
  selector: "app-managed-bundle-card",
  templateUrl: "./managed-bundle-card.component.html",
  styleUrls: ["./managed-bundle-card.component.css"]
})
export class ManagedBundleCardComponent implements OnInit {
  @Input()
  info: ManagedBundleInfo;

  @Input()
  candidateForStages: WorkflowMetadata[];

  active: false;

  constructor() {}
  ngOnInit() {}

  markForStage(status) {

  }
}
