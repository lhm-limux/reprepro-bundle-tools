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
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from "@angular/common/http";
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
  parentTickets?: string[];
}

export const DEP_TYPE_INDEPENDENT_BUNDLES = "Independent Bundles";
export const DEP_TYPE_LATEST_REPLACEMENTS = "Latest Replacements";

const NO_CACHING = new HttpHeaders({
  "Cache-Control":
    "no-cache, no-store, must-revalidate, post-check=0, pre-check=0",
  Pragma: "no-cache",
  Expires: "0"
});

@Injectable({
  providedIn: "root"
})
export class BundleInfosService {
  private changed = new Subject();
  cast = this.changed.asObservable();

  public bundleInfos = new Map<string, BundleInfo>();
  public bundleDeps = new Map<string, BundleInfo[]>();
  public parentToBundle = new Map<string, BundleInfo[]>();

  public statusMap = new Map<string, number>();
  public targetMap = new Map<string, number>();
  public distMap = new Map<string, number>();
  public dependencyTypeCounterMap = new Map<string, number>();

  constructor(private http: HttpClient, private messages: MessagesService) {}

  update() {
    this.http
      .get<BundleInfo[]>("./assets/bundles.json", { headers: NO_CACHING })
      .subscribe(
        (data: BundleInfo[]) => {
          this.bundleInfos.clear();
          this.parentToBundle.clear();
          data.forEach(bundleInfo => {
            this.bundleInfos.set(bundleInfo.id, bundleInfo);
            if (bundleInfo.parentTickets) {
              bundleInfo.parentTickets.forEach((parent: string) => {
                const l = this.parentToBundle.get(parent) || [];
                l.push(bundleInfo);
                this.parentToBundle.set(parent, l);
              });
            }
          });

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
          this.updateDependencies();
          this.changed.next();
        },
        (errResp: HttpErrorResponse) => {
          this.messages.setErrorResponse(
            "Failed to read bundles.json",
            errResp
          );
        }
      );
  }

  private updateDependencies() {
    this.http
      .get<string[][]>("./assets/bundle-deps.json", { headers: NO_CACHING })
      .subscribe(
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
