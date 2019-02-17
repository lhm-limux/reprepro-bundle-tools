/***********************************************************************
 * Copyright (c) 2018 Landeshauptstadt München
 *           (c) 2018 Christoph Lutz (InterFace AG)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the European Union Public Licence (EUPL),
 * version 1.1 (or any later version).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * European Union Public Licence for more details.
 *
 * You should have received a copy of the European Union Public Licence
 * along with this program. If not, see
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
 ***********************************************************************/

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
  managedBundles: { bundle: ManagedBundle; info: ManagedBundleInfo }[];

  @Input()
  candidateForStages: WorkflowMetadata[];

  @Input()
  dropStatus: WorkflowMetadata;

  @Output()
  markedForStage = new EventEmitter<{
    stage: WorkflowMetadata;
    bundles: string[];
  }>();

  @Output()
  clicked = new EventEmitter<ManagedBundle>();

  active = false;

  constructor() {}

  doMarkedForStage(event) {
    this.markedForStage.next(event);
  }

  doClicked(event) {
    this.clicked.next(event);
  }

  markForStage(newStatus) {
    this.markedForStage.next({
      stage: newStatus,
      bundles: this.managedBundles.map(i => i.bundle.id)
    });
  }
}
