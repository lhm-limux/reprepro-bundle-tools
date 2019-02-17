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

import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import {
  ManagedBundle,
  ManagedBundleInfo,
  ConfigService,
  WorkflowMetadata
} from "shared";
import { HttpClient, HttpParams } from "@angular/common/http";

const DEFAULT_ManagedBundleInfo = {
  id: "",
  basedOn: "",
  creator: "",
  subject: "…loading…"
};

interface BundleAndInfo {
  bundle: ManagedBundle;
  info: ManagedBundleInfo;
}

@Injectable({
  providedIn: "root"
})
export class ManagedBundleService {
  constructor(private config: ConfigService, private http: HttpClient) {}
  private changed = new Subject();
  cast = this.changed.asObservable();

  private managedBundles = new Map<string, BundleAndInfo>();

  update(): void {
    this.http
      .get<ManagedBundle[]>(this.config.getApiUrl("managedBundles"))
      .subscribe(
        (data: ManagedBundle[]) => {
          const allIds = new Set<string>();
          const added = new Set<string>();
          for (const b of data) {
            allIds.add(b.id);
            let bi = this.managedBundles.get(b.id);
            if (!bi) {
              bi = { bundle: b, info: DEFAULT_ManagedBundleInfo };
              this.managedBundles.set(b.id, bi);
              added.add(b.id);
            } else {
              bi.bundle = b;
            }
          }
          for (const id of this.managedBundles.keys()) {
            if (!allIds.has(id)) {
              this.managedBundles.delete(id);
            }
          }
          this.changed.next();
          if (added.size > 0) {
            this.updateManagedBundleInfos(Array.from(added));
          }
        },
        errResp => {
          console.error("Error loading managed bundles list", errResp);
        }
      );
  }

  updateManagedBundleInfos(bundles: string[]) {
    const params = new HttpParams().set("bundles", JSON.stringify(bundles));
    this.http
      .get<ManagedBundleInfo[]>(this.config.getApiUrl("managedBundleInfos"), {
        params: params
      })
      .subscribe(
        (data: ManagedBundleInfo[]) => {
          for (const b of data) {
            const managed = this.managedBundles.get(b.id);
            if (managed) {
              managed.info = b;
            }
          }
          this.changed.next();
        },
        errResp => {
          console.error("Error loading managed bundle infos", errResp);
        }
      );
  }

  hasElements(): boolean {
    return this.managedBundles.size > 0;
  }

  getManagedBundle(bundlename: string): BundleAndInfo {
    const bi = this.managedBundles.get(bundlename);
    if (bi && bi.info === DEFAULT_ManagedBundleInfo) {
      this.updateManagedBundleInfos([bundlename]);
    }
    return bi;
  }

  getManagedBundlesForStatus(status: WorkflowMetadata): BundleAndInfo[] {
    const bundles = Array.from(this.managedBundles.values());
    return bundles.filter(bi => bi.bundle.status.name === status.name);
  }

  getAvailableDistributions(): string[] {
    const bundles = Array.from(this.managedBundles.values());
    return Array.from(new Set(bundles.map(bi => bi.bundle.distribution)));
  }

  getAvailableTargets(): string[] {
    const bundles = Array.from(this.managedBundles.values());
    return Array.from(new Set(bundles.map(bi => bi.bundle.target)));
  }
}
