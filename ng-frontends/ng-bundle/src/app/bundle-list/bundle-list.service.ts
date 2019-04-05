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
import { HttpClient } from "@angular/common/http";
import { Bundle } from "shared";
import { ConfigService } from "shared";

@Injectable({
  providedIn: "root"
})
export class BundleListService {
  private changed = new Subject();
  cast = this.changed.asObservable();

  bundles: Bundle[] = [];

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.http.get<Bundle[]>(this.config.getApiUrl("bundleList")).subscribe(
      (data: Bundle[]) => {
        this.bundles = data;
        this.changed.next();
      },
      errResp => {
        console.error("Error loading bundle list", errResp);
      }
    );
  }

  getAvailableDistributions(): Map<string, number> {
    const res = new Map<string, number>();
    for (const b of this.bundles) {
      res.set(b.distribution, res.get(b.distribution) + 1 || 1);
    }
    return res;
  }

  getAvailableTargets(): Map<string, number> {
    const res = new Map<string, number>();
    for (const b of this.bundles) {
      res.set(b.target, res.get(b.target) + 1 || 1);
    }
    return res;
  }

  getUserOrOthers(user: string, bundle: Bundle): string {
    return bundle.creator === user ? user : "Others";
  }

  getAvailableUserOrOthers(user: string): Map<string, number> {
    const res = new Map<string, number>();
    for (const b of this.bundles) {
      const k = this.getUserOrOthers(user, b);
      res.set(k, res.get(k) + 1 || 1);
    }
    return res;
  }

  getAvailableReadonly(): Map<boolean, number> {
    const res = new Map<boolean, number>();
    for (const b of this.bundles) {
      res.set(b.readonly, res.get(b.readonly) + 1 || 1);
    }
    return res;
  }

  getAvailableStates(): Map<"Readonly" | "Editable", number> {
    const res = new Map<"Readonly" | "Editable", number>();
    for (const b of this.bundles) {
      const k = b.readonly ? "Readonly" : "Editable";
      res.set(k, res.get(k) + 1 || 1);
    }
    return res;
  }
}
