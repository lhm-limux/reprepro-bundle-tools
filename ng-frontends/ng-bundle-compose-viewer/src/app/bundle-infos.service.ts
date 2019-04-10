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

@Injectable({
  providedIn: "root"
})
export class BundleInfosService {
  private changed = new Subject();
  cast = this.changed.asObservable();

  public bundleInfos = new Map<string, BundleInfo>();
  public bundleDeps = new Map<string, string[]>();

  public statusMap = new Map<string, number>();
  public targetMap = new Map<string, number>();
  public distMap = new Map<string, number>();

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
            deps.push(to);
            this.bundleDeps.set(from, deps);
          }
        }
        this.changed.next();
      },
      (errResp: HttpErrorResponse) => {
        this.messages.setWarning(
          "Bundle-Abhängigkeiten werden derzeit nicht angezeigt! (bundle-deps.json fehlt)"
        );
      }
    );
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
