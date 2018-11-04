import { Bundle } from "shared/interfaces";
import { BehaviorSubject } from "rxjs";

export class MockBundleListService {
  private bundles = new BehaviorSubject<Bundle[]>([]);
  cast = this.bundles.asObservable();

  update(): void {
    const bundles: Bundle[] = [];
    for (let i = 1; i <= 10; ++i) {
      bundles.push({
        name: "mybionic/" + ("0000" + i).slice(-4),
        distribution: "mybionic",
        target: "plus",
        subject: "This is a bundle",
        readonly: false,
        creator: "chlu"
      });
      bundles.push({
        name: "mytrusty/" + ("0000" + i).slice(-4),
        distribution: "mytrusty",
        target: "plus",
        subject: "This is a bundle",
        readonly: true,
        creator: "some.other"
      });
    }
    this.bundles.next(bundles);
  }

  getAvailableDistributions(): Set<string> {
    return new Set(["mybionic", "mytrusty"]);
  }

  getAvailableTargets(): Set<string> {
    return new Set(["plus", "unattended"]);
  }

  getUserOrOthers(user: string, bundle: Bundle): string {
    return bundle.creator === user ? user : "Others";
  }

  getAvailableUserOrOthers(user: string): Set<string> {
    return new Set(["chlu", "Others"]);
  }

  getAvailableReadonly(): Set<boolean> {
    return new Set([true, false]);
  }
}
