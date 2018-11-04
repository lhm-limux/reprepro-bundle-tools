import { BundleMetadataService } from "./bundle-metadata.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Bundle } from "shared/interfaces";

@Component({
  selector: "app-bundle-edit",
  templateUrl: "./bundle-edit.component.html",
  styleUrls: ["./bundle-edit.component.css"]
})
export class BundleEditComponent implements OnInit {
  bundlename: string = null;
  bundle: Bundle = null;
  basedOn: string;
  releasenotes: string;

  @ViewChild("targetSelect")
  targetSelect;

  constructor(
    private route: ActivatedRoute,
    private bundleMetadataService: BundleMetadataService
  ) {
    route.params.subscribe(p => {
      this.bundlename = p["dist"] + "/" + p["id"];
      this.update();
    });
  }

  ngOnInit() {
    this.update();
  }

  update() {
    if (this.bundlename) {
      this.bundleMetadataService
        .getMetadata(this.bundlename)
        .subscribe(meta => {
          this.bundle = meta.bundle;
          this.basedOn = meta.basedOn;
          this.releasenotes = meta.releasenotes;
        });
    }
  }

  selectTarget($event): void {
    const sel = this.targetSelect.nativeElement;
    if (this.bundle) {
      this.bundle.target = sel.options[sel.selectedIndex].value;
    }
  }
}
