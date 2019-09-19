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
import { BehaviorSubject, Observable } from "rxjs";
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse
} from "@angular/common/http";
import { BundleMetadata, MessagesService, BackendLogEntry } from "shared";
import { ConfigService } from "shared";
import { delay, debounceTime } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class BundleMetadataService {
  private recievedMetdata = new BehaviorSubject<BundleMetadata>(null);

  constructor(
    private config: ConfigService,
    private messages: MessagesService,
    private http: HttpClient
  ) {
    this.recievedMetdata
      .asObservable()
      .pipe(debounceTime(1000))
      .subscribe((m: BundleMetadata) => {
        if (m != null) {
          this.setMetadata(m);
        }
      });
  }

  getMetadata(bundlename): Observable<BundleMetadata> {
    const params = new HttpParams().set("bundlename", bundlename);
    return this.http.get<BundleMetadata>(
      this.config.getApiUrl("getBundleMetadata"),
      {
        params: params
      }
    );
  }

  setMetadataDebounced(metadata: BundleMetadata) {
    this.recievedMetdata.next(metadata);
  }

  setMetadata(metadata: BundleMetadata) {
    console.log("Updating Metadata...");
    const sp = this.messages.addSpinner("Updating Metadata…");
    const params = new HttpParams()
      .set("bundlename", metadata.bundle.name)
      .set("metadata", JSON.stringify(metadata));
    return this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("setBundleMetadata"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Updating Metadata failed", errResp);
        }
      );
  }
}
