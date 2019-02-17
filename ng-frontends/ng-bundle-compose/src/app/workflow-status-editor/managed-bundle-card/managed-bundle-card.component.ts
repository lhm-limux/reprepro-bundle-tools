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

import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { ManagedBundleInfo, ManagedBundle, WorkflowMetadata } from "shared";

@Component({
  selector: "app-managed-bundle-card",
  templateUrl: "./managed-bundle-card.component.html",
  styleUrls: ["./managed-bundle-card.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagedBundleCardComponent implements OnInit {
  active = false;

  @Input()
  bundle: ManagedBundle;

  @Input()
  info: ManagedBundleInfo;

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

  constructor() {}
  ngOnInit() {}

  markForStage(status) {
    this.markedForStage.next({
      stage: status,
      bundles: [ this.bundle.id ]
    });
  }

  emitClicked() {
    this.clicked.next(this.bundle);
  }
}
