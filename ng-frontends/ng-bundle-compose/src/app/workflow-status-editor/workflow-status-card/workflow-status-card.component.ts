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
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  WorkflowMetadata,
  ManagedBundleInfo,
  ManagedBundle,
  FontawsomeToggleButtonComponent
} from "shared";
import { ManagedBundleService } from "./../../services/managed-bundle.service";

@Component({
  selector: "app-workflow-status-card",
  templateUrl: "./workflow-status-card.component.html",
  styleUrls: ["./workflow-status-card.component.css"]
})
export class WorkflowStatusCardComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private knownBundleSign = "";
  managedBundles: { bundle: ManagedBundle; info: ManagedBundleInfo }[] = [];

  @Input()
  cardFormat: string;

  @Input()
  status: WorkflowMetadata;

  @Input()
  validStage: boolean;

  @Input()
  showContent: boolean;

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

  constructor(private bundlesService: ManagedBundleService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.bundlesService.cast.subscribe(() => {
        this.managedBundles = this.bundlesService.getManagedBundlesForStatus(
          this.status
        );
        this.setShowContent(this.showContent);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  doMarkedForStage(event) {
    this.markedForStage.next(event);
  }

  doClicked(event) {
    this.clicked.next(event);
  }

  setShowContent(show: boolean) {
    this.showContent = show;
    if (show) {
      const newBundleSign = this.getListToString(
        this.managedBundles.map(b => b.bundle.id)
      );
      if (newBundleSign !== this.knownBundleSign) {
        this.knownBundleSign = newBundleSign;
        this.bundlesService.updateUnknownManagedBundleInfos([
          ...this.managedBundles.map(b => b.bundle.id)
        ]);
      }
    }
  }

  getListToString(values: string[]): string {
    return [...new Set(values).values()].sort().join(",");
  }

  markForStage(newStatus) {
    this.markedForStage.next({
      stage: newStatus,
      bundles: this.managedBundles.map(i => i.bundle.id)
    });
  }
}
