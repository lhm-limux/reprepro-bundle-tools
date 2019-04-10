import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { BundleInfo } from "../bundle-infos.service";

@Component({
  selector: "app-bundle-info-card",
  templateUrl: "./bundle-info-card.component.html",
  styleUrls: ["./bundle-info-card.component.css"]
})
export class BundleInfoCardComponent implements OnInit {
  @Input()
  bundle: BundleInfo;

  @Input()
  deps: string[];

  @Output()
  bundleSelected = new EventEmitter<string>();

  constructor() {}

  selectBundle(bid: string) {
    this.bundleSelected.next(bid);
  }

  ngOnInit() {}
}
