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

import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import {
  WorkflowMetadata,
  ManagedBundle,
  SelectFilterComponent,
  BackendLogEntry,
  UnpublishedChangesComponent,
  BundleDialogService,
  AuthenticationService,
  VersionedChangesService,
  AuthRef
} from "shared";
import { WorkflowMetadataService } from "../services/workflow-metadata.service";
import { Router } from "@angular/router";
import { ManagedBundleService } from "../services/managed-bundle.service";
import { Subscription } from "rxjs";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";

const STAGES_AND_CANDIDATES = "Stages And Candidates";
const OTHERS = "Others";

@Component({
  selector: "app-workflow-status-editor",
  templateUrl: "./workflow-status-editor.component.html",
  styleUrls: ["./workflow-status-editor.component.css"]
})
export class WorkflowStatusEditorComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private needInit = true;

  workflowMetadata: WorkflowMetadata[] = [];
  configuredStages: string[] = [];

  availableWorkflow = [STAGES_AND_CANDIDATES, OTHERS];
  selectedWorkflow = new Set<string>();

  selectedDistributions = new Set<string>();
  selectedTargets = new Set<string>();

  lastLogs: BackendLogEntry[] = [];

  constructor(
    private workflowMetadataService: WorkflowMetadataService,
    private authenticationService: AuthenticationService,
    public changesService: VersionedChangesService,
    public managedBundleService: ManagedBundleService,
    public actionService: BundleComposeActionService,
    private router: Router
  ) {}

  ngOnInit() {
    this._restoreSettings();
    this.subscriptions.push(
      this.workflowMetadataService.workflowMetadata.subscribe(
        data => (this.workflowMetadata = data)
      )
    );
    this.subscriptions.push(
      this.workflowMetadataService.configuredStages.subscribe(
        data => (this.configuredStages = data)
      )
    );
    this.subscriptions.push(
      this.managedBundleService.cast.subscribe(() => this.initSelections())
    );
    this.subscriptions.push(
      this.actionService.cast.subscribe(data => {
        this.lastLogs = data;
        this.managedBundleService.update();
        this.changesService.update();
      })
    );
    this.workflowMetadataService.update();
    this.managedBundleService.update();
    this.changesService.update();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  initSelections() {
    if (this.needInit && this.managedBundleService.hasElements()) {
      this.selectedDistributions = new Set(
        this.managedBundleService.getAvailableDistributions()
      );
      this.selectedTargets = new Set(
        this.managedBundleService.getAvailableTargets()
      );
      this.needInit = false;
    }
  }

  getWorkflow() {
    return this.workflowMetadata
      .filter(st => st.name !== "UNKNOWN")
      .filter(
        st =>
          (this.selectedWorkflow.has(STAGES_AND_CANDIDATES) &&
            (this.isValidStage(st) ||
              this.getCandidateForStages(st).length > 0)) ||
          this.selectedWorkflow.has(OTHERS)
      );
  }

  getManagedBundleInfosForStatus(status: WorkflowMetadata) {
    return this.managedBundleService
      .getManagedBundleInfosForStatus(status)
      .filter(b => this.selectedDistributions.has(b.managedBundle.distribution))
      .filter(b => this.selectedTargets.has(b.managedBundle.target));
  }

  getCardFormat(status: WorkflowMetadata) {
    if (!this.isValidStage(status)) {
      return "border-info";
    }
    switch (status.stage) {
      case "dev": {
        return "text-white bg-secondary";
      }
      case "test": {
        return "bg-warning";
      }
      case "prod": {
        return "bg-success";
      }
      case "drop": {
        return "text-white bg-danger";
      }
      default: {
        return "border-info";
      }
    }
  }

  isValidStage(status: WorkflowMetadata) {
    return status.stage && this.configuredStages.indexOf(status.stage) >= 0;
  }

  getCandidateForStages(status: WorkflowMetadata) {
    return this.workflowMetadata.filter(
      st => this.isValidStage(st) && st.candidates === status.name
    );
  }

  getDropStatus(status: WorkflowMetadata) {
    if (
      status.name === "DROPPED" ||
      status.name === "PRODUCTION" ||
      status.name === "STAGING"
    ) {
      return null;
    }
    const res = this.workflowMetadata.filter(st => st.name === "DROPPED");
    if (res.length > 0) {
      return res[0];
    }
    return null;
  }

  getShowContent(status: WorkflowMetadata) {
    return !(status.name === "DROPPED" || status.name === "STAGING");
  }

  markForStage(event: { stage: WorkflowMetadata; bundles: ManagedBundle[] }) {
    this.markForStatus(event.stage, event.bundles);
  }

  markForStatus(status: WorkflowMetadata, bundles: ManagedBundle[]) {
    console.log(
      "markForStatus: " +
        JSON.stringify(bundles.map(b => b.id)) +
        " --> " +
        status.name
    );
    this.actionService.markForStatus(status, bundles);
  }

  synchronizeBundles() {
    console.log("synchronizeBundles called");
    this.authenticationService.callWithRequiredAuthentications(
      "bundleSync",
      (refs: AuthRef[]) => {
        this.actionService.updateBundles(refs);
      }
    );
  }

  publishChanges() {
    console.log("publishChanges called");
    this.authenticationService.callWithRequiredAuthentications(
      "publishChanges",
      (refs: AuthRef[]) => {
        this.actionService.publishChanges();
      }
    );
  }

  navigateTo(bundle: ManagedBundle): void {
    this._storeSettings();
    this.router.navigate([
      "/managed-bundle/",
      bundle.distribution,
      bundle.id.split("/")[1]
    ]);
  }

  @HostListener("window:beforeunload", ["$event"])
  private _storeSettings($event: any = null): void {
    const settings: { [key: string]: string[] } = {};
    settings.selectedWorkflow = Array.from(this.selectedWorkflow.values());
    settings.selectedDistributions = Array.from(
      this.selectedDistributions.values()
    );
    settings.selectedTargets = Array.from(this.selectedTargets.values());
    localStorage.setItem(
      "stored-workflow-status-editor-settings",
      JSON.stringify(settings)
    );
  }

  private _restoreSettings(): void {
    const stored = localStorage.getItem(
      "stored-workflow-status-editor-settings"
    );
    if (stored == null) {
      return;
    }
    try {
      const settings: { [key: string]: string[] } = JSON.parse(stored);
      this.selectedWorkflow = new Set<string>(settings.selectedWorkflow);
      this.selectedDistributions = new Set<string>(
        settings.selectedDistributions
      );
      this.selectedTargets = new Set<string>(settings.selectedTargets);
      this.needInit = false;
    } catch (e) {
      console.error(e);
    }
  }
}
