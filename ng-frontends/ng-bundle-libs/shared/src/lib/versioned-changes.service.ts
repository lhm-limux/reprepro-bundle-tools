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
import { VersionedChange } from "./interfaces";
import { ConfigService } from "./config.service";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class VersionedChangesService {
  private changed = new Subject();
  cast = this.changed.asObservable();

  private versionedChanges: VersionedChange[] = [];
  private latestPublishedChange: VersionedChange = null;

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.http
      .get<VersionedChange[]>(this.config.getApiUrl("listChanges"))
      .subscribe(
        (data: VersionedChange[]) => {
          const last = this.versionedChanges;
          this.versionedChanges = data;
          if (last !== data) this.changed.next();
        },
        errResp => {
          console.error("Error loading managed changes list", errResp);
        }
      );
    this.http
      .get<VersionedChange>(this.config.getApiUrl("latestPublishedChange"))
      .subscribe(
        (data: VersionedChange) => {
          const last = this.latestPublishedChange;
          this.latestPublishedChange = data;
          if (last !== data) this.changed.next();
        },
        errResp => {
          console.error("Error loading managed bundle infos list", errResp);
        }
      );
  }

  getVersionedChanges(): VersionedChange[] {
    return this.versionedChanges;
  }

  getLatestPublishedChange(): VersionedChange {
    return this.latestPublishedChange;
  }

  getUnpublishedChanges(): VersionedChange[] {
    return this.versionedChanges.filter(c => !c.published);
  }
}
