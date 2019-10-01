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
  OnChanges
} from "@angular/core";
import { Subscription } from "rxjs";
import { WorkflowMetadata, ManagedBundle } from "shared";
import { ngCopy } from "angular-6-clipboard";
import {
  ManagedBundleService,
  BundleAndInfo
} from "./../../services/managed-bundle.service";

@Component({
  selector: "app-workflow-status-card",
  templateUrl: "./workflow-status-card.component.html",
  styleUrls: ["./workflow-status-card.component.css"]
})
export class WorkflowStatusCardComponent implements OnChanges {
  private subscriptions: Subscription[] = [];
  private knownBundleSign = "";

  @Input()
  cardFormat: string;

  @Input()
  status: WorkflowMetadata;

  @Input()
  managedBundles: BundleAndInfo[];

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

  ngOnChanges(): void {
    this.setShowContent(this.showContent);
  }

  doMarkedForStage(event: any) {
    this.markedForStage.next(event);
  }

  doClicked(event: any) {
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

  markForStage(newStatus: WorkflowMetadata) {
    this.markedForStage.next({
      stage: newStatus,
      bundles: this.managedBundles.map(i => i.bundle.id)
    });
  }

  bundleNamesToClipboard() {
    const names = this.managedBundles
      .map(i => i.bundle.id)
      .sort()
      .join("\n");
    ngCopy("\n" + names);
  }
}
