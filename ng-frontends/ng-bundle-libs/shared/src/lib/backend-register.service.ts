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

import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { v4 as uuid } from "uuid";

@Injectable({
  providedIn: "root"
})
export class BackendRegisterService {
  private uuid = uuid();

  constructor(private config: ConfigService, private http: HttpClient) {}

  registerOnBackend() {
    const params = new HttpParams().set("uuid", this.uuid);
    this.http
      .get<string>(this.config.getApiUrl("register"), {
        params: params
      })
      .subscribe(res => {
        if (res === "registered") {
          console.log("registered on the backend");
        }
      });
  }

  unregisterFromBackend() {
    const params = new HttpParams().set("uuid", this.uuid);
    this.http
      .get<string>(this.config.getApiUrl("unregister"), {
        params: params
      })
      .subscribe(res => {
        if (res === "unregistered") {
          console.log("unregistered from the backend");
        }
      });
  }
}
