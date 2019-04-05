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

import { Subscription } from "rxjs";
import { BundleListService } from "./bundle-list.service";
import { ServerLogComponent } from "./../server-log/server-log.component";
import {
  Component,
  OnInit,
  OnDestroy,
  SystemJsNgModuleLoader,
  HostListener
} from "@angular/core";
import { Bundle } from "shared";
import { Router } from "@angular/router";

@Component({
  selector: "bundle-list",
  templateUrl: "./bundle-list.component.html",
  styleUrls: ["./bundle-list.component.css"]
})
export class BundleListComponent implements OnInit, OnDestroy {
  private needInit = true;
  private subscription: Subscription;

  selectedDistributions = new Set<string>();
  selectedStates = new Set<string>();
  selectedTargets = new Set<string>();
  selectedCreators = new Set<string>();

  highlighted: Bundle;

  username = "chlu";

  constructor(public bls: BundleListService, private router: Router) {}

  ngOnInit() {
    this._restoreSettings();
    this.subscription = this.bls.cast.subscribe(() => this.initSelections());
    this.bls.update();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  initSelections() {
    if (this.needInit && this.bls.bundles.length > 0) {
      this.selectedCreators = new Set(
        this.bls.getAvailableUserOrOthers(this.username).keys()
      );
      this.selectedDistributions = new Set(
        this.bls.getAvailableDistributions().keys()
      );
      this.selectedStates = new Set(this.bls.getAvailableStates().keys());
      this.selectedTargets = new Set(this.bls.getAvailableTargets().keys());
      this.needInit = false;
    }
  }

  getBundles(): Bundle[] {
    return this.bls.bundles
      .filter(b => this.selectedDistributions.has(b.distribution))
      .filter(b => this.selectedTargets.has(b.target))
      .filter(b =>
        this.selectedStates.has(b.readonly ? "Readonly" : "Editable")
      )
      .filter(b =>
        this.selectedCreators.has(this.bls.getUserOrOthers(this.username, b))
      );
  }

  navigateTo(bundle: Bundle): void {
    this._storeSettings();
    this.router.navigate([
      "/bundle/",
      bundle.distribution,
      bundle.name.split("/")[1]
    ]);
  }

  @HostListener("window:beforeunload", ["$event"])
  private _storeSettings($event: any = null): void {
    const settings: { [key: string]: string[] } = {};
    settings.selectedCreators = Array.from(this.selectedCreators.values());
    settings.selectedDistributions = Array.from(
      this.selectedDistributions.values()
    );
    settings.selectedStates = Array.from(this.selectedStates.values());
    settings.selectedTargets = Array.from(this.selectedTargets.values());
    localStorage.setItem(
      "stored-bundle-list-settings",
      JSON.stringify(settings)
    );
  }

  private _restoreSettings(): void {
    const stored = localStorage.getItem("stored-bundle-list-settings");
    if (stored == null) {
      return;
    }
    try {
      const settings: { [key: string]: string[] } = JSON.parse(stored);
      this.selectedCreators = new Set<string>(settings.selectedCreators);
      this.selectedDistributions = new Set<string>(
        settings.selectedDistributions
      );
      this.selectedStates = new Set<string>(settings.selectedStates);
      this.selectedTargets = new Set<string>(settings.selectedTargets);
      this.needInit = false;
    } catch (e) {
      console.error(e);
    }
  }
}
