import { Component, OnInit, Input } from "@angular/core";
import { BundleInfo } from "../bundle-infos.service";

@Component({
  selector: "app-bundle-info-card",
  templateUrl: "./bundle-info-card.component.html",
  styleUrls: ["./bundle-info-card.component.css"]
})
export class BundleInfoCardComponent implements OnInit {
  @Input()
  bundle: BundleInfo;

  constructor() {}

  ngOnInit() {}
}
