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

import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { WorkflowMetadata, ManagedBundle, ManagedBundleInfo, TargetDescription } from "shared";
import { ManagedBundleService } from "../services/managed-bundle.service";
import { WorkflowMetadataService } from "../services/workflow-metadata.service";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";

@Component({
  selector: "app-managed-bundle-editor",
  templateUrl: "./managed-bundle-editor.component.html",
  styleUrls: ["./managed-bundle-editor.component.css"]
})
export class ManagedBundleEditorComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  bundlename: string;
  bundle: ManagedBundle;
  info: ManagedBundleInfo;
  private workflow: WorkflowMetadata[] = [];
  private targets: TargetDescription[] = [];
  hoveredStatus: WorkflowMetadata = null;

  @ViewChild("targetSelect")
  targetSelect;

  constructor(
    private route: ActivatedRoute,
    private bundleService: ManagedBundleService,
    private metadataService: WorkflowMetadataService,
    public actionService: BundleComposeActionService
  ) {
    this.subscriptions.push(
      this.metadataService.workflowMetadata.subscribe(
        data => (this.workflow = data)
      )
    );
    this.subscriptions.push(
      this.metadataService.configuredTargets.subscribe(
        data => (this.targets = data)
      )
    );
    this.subscriptions.push(
      this.route.params.subscribe(p => {
        this.bundlename = "bundle:" + p["dist"] + "/" + p["id"];
        this.update();
      })
    );
    this.subscriptions.push(
      this.actionService.cast.subscribe(data => {
        this.bundleService.update();
      })
    );
    this.subscriptions.push(
      this.bundleService.cast.subscribe(() => this.update())
    );
    this.metadataService.update();
    this.bundleService.update();
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  getVisibleWorkflow(): WorkflowMetadata[] {
    return this.workflow.filter(s => s.name !== "UNKNOWN");
  }

  getTargets(): TargetDescription[] {
    return this.targets;
  }

  markForStatus(s): void {
    this.actionService.markForStatus(s, [this.bundle.id]);
  }

  setTarget(): void {
    const sel = this.targetSelect.nativeElement;
    const newTarget = sel.options[sel.selectedIndex].value;
    this.actionService.setTarget(newTarget, [this.bundle]);
  }

  update(): void {
    const b = this.bundleService.getManagedBundle(this.bundlename);
    if (b) {
      this.bundle = b.bundle;
      this.info = b.info;
    }
  }
}
