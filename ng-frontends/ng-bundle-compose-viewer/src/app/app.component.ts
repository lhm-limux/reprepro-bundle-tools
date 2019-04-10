import { Component, OnInit, OnDestroy } from "@angular/core";
import { BundleInfosService, BundleInfo } from "./bundle-infos.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  bundleInfos: BundleInfo[] = [];
  bundleDeps = new Map<string, string[]>();
  statusMap = new Map<string, number>();
  targetMap = new Map<string, number>();
  distMap = new Map<string, number>();

  selectedStatus = new Set<string>();
  selectedTarget = new Set<string>();
  selectedDist = new Set<string>();
  searchStr = "";

  constructor(private infos: BundleInfosService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.infos.cast.subscribe(() => {
        this.statusMap = new Map(this.infos.statusMap);
        this.targetMap = new Map(this.infos.targetMap);
        this.distMap = new Map(this.infos.distMap);
        this.bundleDeps = new Map(this.infos.bundleDeps);

        this.selectedStatus = new Set(this.statusMap.keys());
        this.selectedTarget = new Set(this.targetMap.keys());
        this.selectedDist = new Set(this.distMap.keys());
        this.selectedStatus.delete("dropped");

        this.updateFilter();
      })
    );
    this.infos.update();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  handleSearch(searchString: string = "") {
    this.searchStr = searchString;
    this.updateFilter();
  }

  updateFilter() {
    const preFiltered = [...this.infos.bundleInfos.values()].filter(b => {
      const dist = this.infos.parseBundleId(b.id).dist || "unknown";
      return (
        this.selectedStatus.has(b.status) &&
        this.selectedTarget.has(b.target) &&
        this.selectedDist.has(dist)
      );
    });

    const search = this.searchStr.split(" ");
    this.bundleInfos = preFiltered.filter((info: BundleInfo) => {
      if (this.searchStr.length === 0) {
        return true;
      }
      const bid = this.infos.parseBundleId(info.id);
      for (const s of search) {
        if (s.length === 0) {
          continue;
        }
        if (bid) {
          if (Number.parseInt(s, 10) === bid.num) {
            continue;
          }
        }
        if (info.subject.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        if (info.ticket.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        if (info.creator.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        return false;
      }
      return true;
    });
  }

  selectBundle(bid: string) {
    if (this.infos.bundleInfos.has(bid)) {
      this.bundleInfos = [this.infos.bundleInfos.get(bid)];
    }
  }
}
