import { Injectable } from "@angular/core";
import { Observer, Observable, BehaviorSubject } from "rxjs";
import { Bundle } from "../shared/bundle";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class BundleListService {
  private bundles = new BehaviorSubject<Bundle[]>([]);
  cast = this.bundles.asObservable();

  constructor(private http: HttpClient) {}

  update(): void {
    this.http.get<Bundle[]>("/bundleList").subscribe(
      (bundles: Bundle[]) => {
        this.bundles.next(bundles);
      },
      errResp => {
        console.error("Error loading bundle list", errResp);
      }
    );
  }

  getAvailableDistributions(): Set<string> {
    return new Set(this.bundles.getValue().map(bundle => bundle.distribution));
  }

  getAvailableTargets(): Set<string> {
    return new Set(this.bundles.getValue().map(bundle => bundle.target));
  }

  getUserOrOthers(user: string, bundle: Bundle): string {
    return bundle.creator === user ? user : "Others";
  }

  getAvailableUserOrOthers(user: string): Set<string> {
    return new Set(
      this.bundles.getValue().map(bundle => this.getUserOrOthers(user, bundle))
    );
  }

  getAvailableReadonly(): Set<boolean> {
    return new Set(this.bundles.getValue().map(bundle => bundle.readonly));
  }
}
