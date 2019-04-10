import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { BundleInfo } from "../bundle-infos.service";
import { Router } from "@angular/router";

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

  constructor(private router: Router) {}

  ngOnInit() {}
}
