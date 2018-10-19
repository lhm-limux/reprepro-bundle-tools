import { BundleListService } from "./bundle-list.service";
import { ServerLogComponent } from "./../server-log/server-log.component";
import { Component, OnInit, SystemJsNgModuleLoader } from "@angular/core";
import { Bundle } from "../shared/bundle";

@Component({
  selector: "bundle-list",
  templateUrl: "./bundle-list.component.html",
  styleUrls: ["./bundle-list.component.css"]
})
export class BundleListComponent implements OnInit {
  filter = new Set();
  bundles: Bundle[] = [];

  constructor(private bundleListService: BundleListService) {}

  ngOnInit() {
    this.update();
  }

  update() {
    this.bundleListService.getBundleList().subscribe(
      (bundles: Bundle[]) => {
        this.bundles = bundles;
      },
      errResp => {
        console.error('Error loading bundle list', errResp);
      }
    );
  }

  getBundles(): Bundle[] {
    if (this.filter.size > 0) {
      return this.bundles.filter(
        (b) => b.distribution === this.filter['distribution']
      );
    } else {
      return this.bundles;
    }
  }

  addFilter(field, value): void {
    //console.log("addFilter("+field+","+value+")");
    this.filter[field] = value;
  }
}
