import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BundleMetadata } from "../shared/bundle-metadata";

@Injectable({
  providedIn: "root"
})
export class BundleMetadataService {
  constructor(private http: HttpClient) {}

  getMetadata(bundlename): Observable<BundleMetadata> {
    const params = new HttpParams().set("bundlename", bundlename);
    return this.http.get<BundleMetadata>("/api/bundleMetadata", {
      params: params
    });
  }
}
