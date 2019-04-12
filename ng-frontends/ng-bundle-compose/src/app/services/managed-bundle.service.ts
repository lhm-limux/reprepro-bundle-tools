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

const BUNDLE_INFOS_CHUNK_SIZE = 10;

const DEFAULT_ManagedBundleInfo = {
  id: "",
  basedOn: "",
  creator: "",
  subject: "…loading…"
};

const MISSING_ManagedBundleInfo = {
  id: "",
  basedOn: "",
  creator: "",
  subject: "<<NOT AVAILABLE>>"
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
  private firstTime = true;
  private changed = new Subject();
  cast = this.changed.asObservable();

  private managedBundles = new Map<string, BundleAndInfo>();

  update(): void {
    this.http
      .get<ManagedBundle[]>(this.config.getApiUrl("managedBundles"))
      .subscribe(
        (data: ManagedBundle[]) => {
          const allIds = new Set<string>();
          for (const b of data) {
            allIds.add(b.id);
            let bi = this.managedBundles.get(b.id);
            if (!bi) {
              bi = { bundle: b, info: DEFAULT_ManagedBundleInfo };
              this.managedBundles.set(b.id, bi);
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

          // The first time start to retrieve unknown BundleInfos in chunks (running in the background)
          if (this.firstTime) {
            this.firstTime = false;
            this.updateUnknownManagedBundleInfos(
              [...this.managedBundles.values()]
                .filter(b => b.bundle.status.name !== "DROPPED")
                .map(b => b.bundle.id),
              BUNDLE_INFOS_CHUNK_SIZE
            );
          }
        },
        errResp => {
          console.error("Error loading managed bundles list", errResp);
        }
      );
  }

  updateUnknownManagedBundleInfos(
    bundleIds: string[],
    chunkSize = BUNDLE_INFOS_CHUNK_SIZE
  ) {
    const needUpdateBundles = this.getBundlesWithoutInfo(bundleIds);
    if (needUpdateBundles.length > 0) {
      this.updateManagedBundleInfos([...needUpdateBundles], chunkSize);
    }
  }

  private getBundlesWithoutInfo(bundleIds: string[]) {
    return bundleIds.filter(
      bid =>
        this.managedBundles.has(bid) &&
        this.managedBundles.get(bid).info === DEFAULT_ManagedBundleInfo
    );
  }

  private updateManagedBundleInfos(bundles: string[], chunkSize = 0) {
    console.log(bundles);
    if (bundles.length === 0) {
      return;
    }
    const chunk = chunkSize > 0 ? bundles.slice(0, chunkSize) : bundles;
    const params = new HttpParams().set("bundles", JSON.stringify(chunk));
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
          // set MISSING_ManagedBundleInfo for expected but not delivered bundles
          this.getBundlesWithoutInfo(chunk).forEach(
            bid =>
              (this.managedBundles.get(bid).info = MISSING_ManagedBundleInfo)
          );
          this.changed.next();
          // load next chunk
          if (chunkSize > 0) {
            this.updateManagedBundleInfos(bundles.slice(chunkSize), chunkSize);
          }
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

  getAvailableDistributions(): Map<string, number> {
    const res = new Map<string, number>();
    for (const b of this.managedBundles.values()) {
      res.set(b.bundle.distribution, res.get(b.bundle.distribution) + 1 || 1);
    }
    return res;
  }

  getAvailableTargets(): Map<string, number> {
    const res = new Map<string, number>();
    for (const b of this.managedBundles.values()) {
      res.set(b.bundle.target, res.get(b.bundle.target) + 1 || 1);
    }
    return res;
  }
}
