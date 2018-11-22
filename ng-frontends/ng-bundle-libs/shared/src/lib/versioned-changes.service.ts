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
