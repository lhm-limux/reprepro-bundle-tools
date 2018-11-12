import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ManagedBundle, ManagedBundleInfo, ConfigService, WorkflowMetadata } from "shared";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class ManagedBundleService {
  private managedBundles: ManagedBundle[] = [];
  private managedBundleInfos: ManagedBundleInfo[] = [];

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.http
      .get<ManagedBundle[]>(this.config.getApiUrl("managedBundles"))
      .subscribe(
        (data: ManagedBundle[]) => {
          this.managedBundles = data;
        },
        errResp => {
          console.error("Error loading managed bundles list", errResp);
        }
      );
    this.http
      .get<ManagedBundleInfo[]>(this.config.getApiUrl("managedBundleInfos"))
      .subscribe(
        (data: ManagedBundleInfo[]) => {
          this.managedBundleInfos = data;
          this.managedBundles = data.map(mbi => mbi.managedBundle);
        },
        errResp => {
          console.error("Error loading managed bundle infos list", errResp);
        }
      );
  }

  getManagedBundleInfosForStatus(status: WorkflowMetadata): ManagedBundleInfo[] {
    let mbInfos: ManagedBundleInfo[] = [];
    if (this.managedBundleInfos.length > 0) {
      mbInfos = this.managedBundleInfos;
    } else {
      mbInfos = this.managedBundles.map(
        (mb): ManagedBundleInfo => {
          return {
            managedBundle: mb,
            basedOn: "",
            subject: "",
            creator: ""
          };
        }
      );
    }
    return mbInfos.filter((mbi) => mbi.managedBundle.status.name === status.name);
  }
}
