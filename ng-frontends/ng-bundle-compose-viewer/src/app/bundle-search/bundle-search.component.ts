import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import {
  BundleInfo,
  BundleInfosService,
  DEP_TYPE_INDEPENDENT_BUNDLES,
  DEP_TYPE_LATEST_REPLACEMENTS
} from "../bundle-infos.service";

@Component({
  selector: "app-bundle-search",
  templateUrl: "./bundle-search.component.html",
  styleUrls: ["./bundle-search.component.css"]
})
export class BundleSearchComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  selectedBundle: string = null;

  bundleInfos: BundleInfo[] = [];
  bundleDeps = new Map<string, BundleInfo[]>();
  statusMap = new Map<string, number>();
  targetMap = new Map<string, number>();
  distMap = new Map<string, number>();
  showOnlyMap = new Map<string, number>();

  selectedStatus = new Set<string>();
  selectedTarget = new Set<string>();
  selectedDist = new Set<string>();
  selectedShowOnly = new Set<string>();
  latestReplacements = new Set<string>();
  searchStr = "";

  constructor(
    private infos: BundleInfosService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.queryParams.subscribe(p => {
        this.selectedBundle = p["bid"];
        this.update();
      })
    );
    this.subscriptions.push(
      this.infos.cast.subscribe(() => {
        this.statusMap = new Map(this.infos.statusMap);
        this.targetMap = new Map(this.infos.targetMap);
        this.distMap = new Map(this.infos.distMap);
        this.bundleDeps = new Map(this.infos.bundleDeps);
        this.showOnlyMap = new Map(this.infos.dependencyTypeCounterMap);

        this.latestReplacements = new Set(
          this.infos.getLatestReplacementBundleIds()
        );
        this.selectedStatus = new Set(this.statusMap.keys());
        this.selectedTarget = new Set(this.targetMap.keys());
        this.selectedDist = new Set(this.distMap.keys());
        this.selectedStatus.delete("DROPPED");
        this.selectedStatus.delete("PRODUCTION");

        this.update();
      })
    );
    this.infos.update();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  handleSearch(searchString: string = "") {
    this.searchStr = searchString;
    this.selectedBundle = null;
    this.update();
  }

  update() {
    if (
      this.selectedBundle &&
      this.infos.bundleInfos.has(this.selectedBundle)
    ) {
      this.bundleInfos = [this.infos.bundleInfos.get(this.selectedBundle)];
      return;
    }

    const selectOnlyIndependentBundles = this.selectedShowOnly.has(
      DEP_TYPE_INDEPENDENT_BUNDLES
    );
    const selectOnlyLatestReplacements = this.selectedShowOnly.has(
      DEP_TYPE_LATEST_REPLACEMENTS
    );

    const preFiltered = [...this.infos.bundleInfos.values()].filter(b => {
      const dist = this.infos.parseBundleId(b.id).dist || "unknown";
      return (
        this.selectedStatus.has(b.status) &&
        this.selectedTarget.has(b.target) &&
        this.selectedDist.has(dist) &&
        !(selectOnlyIndependentBundles && this.bundleDeps.get(b.id)) &&
        !(selectOnlyLatestReplacements && !this.latestReplacements.has(b.id))
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
        if (Number.parseInt(info.ticket, 10) === Number.parseInt(s, 10)) {
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
}
