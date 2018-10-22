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
    const res = new Set<string>();
    this.bundles.getValue().forEach(bundle => res.add(bundle.distribution));
    return res;
  }

  getAvailableTargets(): Set<string> {
    const res = new Set<string>();
    this.bundles.getValue().forEach(bundle => res.add(bundle.target));
    return res;
  }

  getUserOrOthers(user: string, bundle: Bundle): string {
    return bundle.creator === user ? user : "Others";
  }

  getAvailableUserOrOthers(user: string): Set<string> {
    const res = new Set<string>();
    this.bundles
      .getValue()
      .forEach(bundle => res.add(this.getUserOrOthers(user, bundle)));
    return res;
  }

  getAvailableReadonly(): Set<boolean> {
    const res = new Set<boolean>();
    this.bundles.getValue().forEach(bundle => res.add(bundle.readonly));
    return res;
  }
}
