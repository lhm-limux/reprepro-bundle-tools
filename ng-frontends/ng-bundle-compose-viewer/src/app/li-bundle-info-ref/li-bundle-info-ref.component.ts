import { Component, OnInit, Input } from "@angular/core";
import { BundleInfo } from "../bundle-infos.service";

@Component({
  selector: "app-li-bundle-info-ref",
  templateUrl: "./li-bundle-info-ref.component.html",
  styleUrls: ["./li-bundle-info-ref.component.css"]
})
export class LiBundleInfoRefComponent implements OnInit {
  @Input()
  bundle: BundleInfo;

  @Input()
  showParentTree = false;

  constructor() {}

  ngOnInit() {}
}
