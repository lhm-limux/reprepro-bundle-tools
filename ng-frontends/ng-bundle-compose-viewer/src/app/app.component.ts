import { Component, OnInit } from "@angular/core";
import { BundleInfosService, BundleInfo } from "./bundle-infos.service";
import { HttpErrorResponse } from "@angular/common/http";
import { NONE_TYPE } from "@angular/compiler/src/output/output_ast";
import { distinct } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  error: HttpErrorResponse;

  allBundleInfos: BundleInfo[] = [];
  bundleInfos: BundleInfo[] = [];

  statusSet = new Map<string, number>();
  targetSet = new Map<string, number>();
  distSet = new Map<string, number>();

  constructor(private infoService: BundleInfosService) {}

  ngOnInit(): void {
    this.infoService.getBundleInfos().subscribe(
      (data: BundleInfo[]) => {
        this.allBundleInfos = data;
        this.handleSearch();

        this.statusSet.clear();
        this.targetSet.clear();
        this.distSet.clear();
        this.allBundleInfos.forEach(b => {
          this.statusSet.set(b.status, this.statusSet.get(b.status) + 1 || 1);
          this.targetSet.set(b.target, this.targetSet.get(b.target) + 1 || 1);
          const info = this.parseBundleId(b.id);
          if (info) {
            this.distSet.set(info.dist, this.distSet.get(info.dist) + 1 || 1);
          }
        });
      },
      (errResp: HttpErrorResponse) => {
        this.error = errResp;
      }
    );
  }

  handleSearch(searchString: string = "") {
    const search = searchString.split(" ");
    this.bundleInfos = this.allBundleInfos.filter((info: BundleInfo) => {
      if (searchString.length === 0) {
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
          if (bid.dist.startsWith(s)) {
            continue;
          }
        }
        if (info.subject.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        if (info.target.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        if (info.ticket.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        if (info.creator.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        if (info.status.toLowerCase().includes(s.toLowerCase())) {
          continue;
        }
        return false;
      }
      return true;
    });
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
