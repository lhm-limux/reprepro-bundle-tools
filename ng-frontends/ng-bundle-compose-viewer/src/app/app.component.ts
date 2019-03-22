import { Component, OnInit } from "@angular/core";
import { BundleInfosService, BundleInfo } from "./bundle-infos.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  bundleInfos: BundleInfo[] = [];

  constructor(private infoService: BundleInfosService) {}

  ngOnInit(): void {
    this.infoService.getBundleInfos().subscribe((data: BundleInfo[]) => {
      this.bundleInfos = data;
    });
  }
}
