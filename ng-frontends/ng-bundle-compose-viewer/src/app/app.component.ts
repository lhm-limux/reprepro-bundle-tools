import { Component, OnInit } from "@angular/core";
import { BundleInfosService, BundleInfo } from "./bundle-infos.service";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  error: HttpErrorResponse;

  allBundleInfos: BundleInfo[] = [];
  filteredAllBundleInfos: BundleInfo[] = [];
  bundleInfos: BundleInfo[] = [];

  statusMap = new Map<string, number>();
  targetMap = new Map<string, number>();
  distMap = new Map<string, number>();

  selectedStatus = new Set<string>();
  selectedTarget = new Set<string>();
  selectedDist = new Set<string>();
  searchStr = "";

  constructor(private infoService: BundleInfosService) {}

  ngOnInit(): void {
    this.infoService.getBundleInfos().subscribe(
      (data: BundleInfo[]) => {
        this.allBundleInfos = data;

        this.statusMap.clear();
        this.targetMap.clear();
        this.distMap.clear();
        this.allBundleInfos.forEach(b => {
          this.statusMap.set(b.status, this.statusMap.get(b.status) + 1 || 1);
          this.targetMap.set(b.target, this.targetMap.get(b.target) + 1 || 1);
          const info = this.parseBundleId(b.id);
          if (info) {
            this.distMap.set(info.dist, this.distMap.get(info.dist) + 1 || 1);
          }
        });
        this.selectedStatus = new Set<string>(this.statusMap.keys());
        this.selectedTarget = new Set<string>(this.targetMap.keys());
        this.selectedDist = new Set<string>(this.distMap.keys());
        this.selectedStatus.delete("dropped");

        this.update();
      },
      (errResp: HttpErrorResponse) => {
        this.error = errResp;
      }
    );
  }

  handleSearch(searchString: string = "") {
    this.searchStr = searchString;
    this.update();
  }

  update() {
    this.filteredAllBundleInfos = this.allBundleInfos.filter(b => {
      const dist = this.parseBundleId(b.id).dist || "unknown";
      return (
        this.selectedStatus.has(b.status) &&
        this.selectedTarget.has(b.target) &&
        this.selectedDist.has(dist)
      );
    });

    const search = this.searchStr.split(" ");
    this.bundleInfos = this.filteredAllBundleInfos.filter(
      (info: BundleInfo) => {
        if (this.searchStr.length === 0) {
          return true;
        }
        const bid = this.parseBundleId(info.id);
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
      }
    );
  }

  private parseBundleId(bid: string): { dist: string; num: number } {
    const parts = bid.split(":");
    if (parts.length === 2) {
      const p2 = parts[1].split("/");
      if (p2.length === 2) {
        return { dist: p2[0], num: Number.parseInt(p2[1], 10) };
      }
    }
    return undefined;
  }
}
