import { Injectable } from "@angular/core";
import { ConfigService, ManagedBundle, WorkflowMetadata } from "shared";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class BundleComposeActionService {
  private changed = new BehaviorSubject<string>("");
  cast = this.changed.asObservable();

  constructor(private config: ConfigService, private http: HttpClient) {}

  updateBundles(): void {
    this.http.get<string>(this.config.getApiUrl("updateBundles")).subscribe(
      (data: string) => {
        this.changed.next(data);
      },
      errResp => {
        this.changed.next("Update Bundles failed: " + errResp);
      }
    );
  }

  markForStatus(status: WorkflowMetadata, bundles: ManagedBundle[]): void {
    const params = new HttpParams()
      .set("status", status.name)
      .set("bundles", JSON.stringify(bundles.map(b => b.id)));
    this.http.get<string>(this.config.getApiUrl("markForStatus"), { params: params }).subscribe(
      (data: string) => {
        this.changed.next(data);
      },
      errResp => {
        this.changed.next("Mark for stage failed: " + errResp);
      }
    );
  }
}
