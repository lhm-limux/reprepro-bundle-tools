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
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

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
  constructor(private http: HttpClient) {}

  getBundleInfos(): Observable<BundleInfo[]> {
    return this.http.get<BundleInfo[]>("./assets/bundles.json");
  }
}
