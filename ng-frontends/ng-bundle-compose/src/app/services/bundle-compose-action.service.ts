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
  ConfigService,
  BundleDialogService,
  ManagedBundle,
  WorkflowMetadata,
  BackendLogEntry,
  AuthType,
  AuthRef
} from "shared";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class BundleComposeActionService {
  private changed = new BehaviorSubject<BackendLogEntry[]>([]);
  cast = this.changed.asObservable();

  constructor(private config: ConfigService, private http: HttpClient) {}

  updateBundles(refs: AuthRef[]): void {
    const params = new HttpParams().set("refs", JSON.stringify(refs));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("updateBundles"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.changed.next(data);
        },
        errResp => {
          console.error("Update Bundles failed: " + errResp);
        }
      );
  }

  markForStatus(status: WorkflowMetadata, bundles: ManagedBundle[]): void {
    const params = new HttpParams()
      .set("status", status.name)
      .set("bundles", JSON.stringify(bundles.map(b => b.id)));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("markForStatus"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.changed.next(data);
        },
        errResp => {
          console.error("Mark for stage failed: " + errResp);
        }
      );
  }

  setTarget(target: string, bundles: ManagedBundle[]): void {
    const params = new HttpParams()
      .set("target", target)
      .set("bundles", JSON.stringify(bundles.map(b => b.id)));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("setTarget"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.changed.next(data);
        },
        errResp => {
          console.error("Set Target failed: " + errResp);
        }
      );
  }

  undoLastChange(): void {
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("undoLastChange"))
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.changed.next(data);
        },
        errResp => {
          console.error("Undo last Change failed: ", errResp);
        }
      );
  }

  publishChanges(): void {
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("publishChanges"))
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.changed.next(data);
        },
        errResp => {
          console.error("Publish Changes failed: ", errResp);
        }
      );
  }
}
