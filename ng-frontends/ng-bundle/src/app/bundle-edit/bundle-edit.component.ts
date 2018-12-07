/***********************************************************************
* Copyright (c) 2018 Landeshauptstadt München
*           (c) 2018 Christoph Lutz (InterFace AG)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the European Union Public Licence (EUPL),
* version 1.1 (or any later version).
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* European Union Public Licence for more details.
*
* You should have received a copy of the European Union Public Licence
* along with this program. If not, see
* https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
***********************************************************************/

import { BundleMetadataService } from "./bundle-metadata.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Bundle } from "shared";

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
