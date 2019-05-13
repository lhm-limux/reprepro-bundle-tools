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
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { MessagesService } from "shared";
import { Subscription, Subject } from "rxjs";

export interface BundleInfo {
  id: string;
  target: string;
  status: string;
  basedOn: string;
  subject: string;
  creator: string;
  ticket: string;
  ticketUrl: string;
}

export const DEP_TYPE_INDEPENDENT_BUNDLES = "Independent Bundles";
export const DEP_TYPE_LATEST_REPLACEMENTS = "Latest Replacements";

@Injectable({
  providedIn: "root"
})
export class BundleInfosService {
  private changed = new Subject();
  cast = this.changed.asObservable();

  public bundleInfos = new Map<string, BundleInfo>();
  public bundleDeps = new Map<string, BundleInfo[]>();

  public statusMap = new Map<string, number>();
  public targetMap = new Map<string, number>();
  public distMap = new Map<string, number>();
  public dependencyTypeCounterMap = new Map<string, number>();

  constructor(private http: HttpClient, private messages: MessagesService) {}

  update() {
    this.http.get<BundleInfo[]>("./assets/bundles.json").subscribe(
      (data: BundleInfo[]) => {
        this.bundleInfos.clear();
        data.forEach(bundleInfo =>
          this.bundleInfos.set(bundleInfo.id, bundleInfo)
        );

        this.statusMap.clear();
        this.targetMap.clear();
        this.distMap.clear();
        this.bundleInfos.forEach(b => {
          this.statusMap.set(b.status, this.statusMap.get(b.status) + 1 || 1);
          this.targetMap.set(b.target, this.targetMap.get(b.target) + 1 || 1);
          const info = this.parseBundleId(b.id);
          if (info) {
            this.distMap.set(info.dist, this.distMap.get(info.dist) + 1 || 1);
          }
        });
        this.updateDependencyTypeCounterMap();
        this.changed.next();
      },
      (errResp: HttpErrorResponse) => {
        this.messages.setErrorResponse("Failed to read bundles.json", errResp);
      }
    );

    this.http.get<string[][]>("./assets/bundle-deps.json").subscribe(
      (data: string[][]) => {
        this.bundleDeps.clear();
        for (const edge of data) {
          if (edge.length === 2) {
            const from = edge[0].replace("bundle/", "bundle:");
            const to = edge[1].replace("bundle/", "bundle:");
            const deps = this.bundleDeps.get(from) || [];
            const toInfo = this.bundleInfos.get(to);
            if (toInfo) {
              deps.push(this.bundleInfos.get(to));
              this.bundleDeps.set(from, deps);
            }
          }
        }
        this.updateDependencyTypeCounterMap();
        this.changed.next();
      },
      (errResp: HttpErrorResponse) => {
        this.messages.setWarning(
          "Bundle-Dependencies could not be shown at the moment! (bundle-deps.json missing)"
        );
      }
    );
  }

  private updateDependencyTypeCounterMap() {
    this.dependencyTypeCounterMap.clear();
    if (this.bundleDeps.size === 0) {
      return;
    }
    const latestReplacements = this.getLatestReplacementBundleIds();
    for (const b of this.bundleInfos.values()) {
      if (!this.bundleDeps.get(b.id)) {
        this.dependencyTypeCounterMap.set(
          DEP_TYPE_INDEPENDENT_BUNDLES,
          this.dependencyTypeCounterMap.get(DEP_TYPE_INDEPENDENT_BUNDLES) + 1 ||
            1
        );
      }
      if (latestReplacements.has(b.id)) {
        this.dependencyTypeCounterMap.set(
          DEP_TYPE_LATEST_REPLACEMENTS,
          this.dependencyTypeCounterMap.get(DEP_TYPE_LATEST_REPLACEMENTS) + 1 ||
            1
        );
      }
    }
  }

  /* Returns a set of all Bundles not mentioned in any "Replaces packages of"-List.
   */
  public getLatestReplacementBundleIds(): Set<string> {
    const bIds = new Set(this.bundleInfos.keys());
    for (const deps of this.bundleDeps.values()) {
      deps.forEach(d => bIds.delete(d.id));
    }
    return bIds;
  }

  public parseBundleId(bid: string): { dist: string; num: number } {
    const parts = bid.split(":");
    if (parts.length === 2) {
      const p2 = parts[1].split("/");
      if (p2.length === 2) {
        return { dist: p2[0], num: Number.parseInt(p2[1], 10) };
      }
    }
    return undefined;
  }
}
