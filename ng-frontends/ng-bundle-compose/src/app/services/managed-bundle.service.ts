import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import {
  ManagedBundle,
  ManagedBundleInfo,
  ConfigService,
  WorkflowMetadata
} from "shared";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class ManagedBundleService {
  private changed = new Subject();
  cast = this.changed.asObservable();

  private managedBundles: ManagedBundle[] = [];
  private managedBundleInfos: ManagedBundleInfo[] = [];

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.http
      .get<ManagedBundle[]>(this.config.getApiUrl("managedBundles"))
      .subscribe(
        (data: ManagedBundle[]) => {
          this.managedBundles = data;
          this.changed.next();
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
          this.changed.next();
        },
        errResp => {
          console.error("Error loading managed bundle infos list", errResp);
        }
      );
  }

  hasElements(): boolean {
    return this.managedBundles.length > 0;
  }

  getManagedBundleInfo(bundlename: string): ManagedBundleInfo {
    const found = this.managedBundleInfos.filter(
      i => i.managedBundle.id === bundlename
    );
    return found.length >= 0 ? found[0] : null;
  }

  getManagedBundleInfosForStatus(
    status: WorkflowMetadata
  ): ManagedBundleInfo[] {
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
    return mbInfos.filter(mbi => mbi.managedBundle.status.name === status.name);
  }

  getAvailableDistributions(): string[] {
    return Array.from(
      new Set(this.managedBundles.map(bundle => bundle.distribution))
    );
  }

  getAvailableTargets(): string[] {
    return Array.from(
      new Set(this.managedBundles.map(bundle => bundle.target))
    );
  }
}
