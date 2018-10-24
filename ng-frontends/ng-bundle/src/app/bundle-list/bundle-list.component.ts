import { BundleListService } from "./bundle-list.service";
import { ServerLogComponent } from "./../server-log/server-log.component";
import { Component, OnInit, SystemJsNgModuleLoader } from "@angular/core";
import { Bundle } from "../shared/bundle";
import { Router } from "@angular/router";

@Component({
  selector: "bundle-list",
  templateUrl: "./bundle-list.component.html",
  styleUrls: ["./bundle-list.component.css"]
})
export class BundleListComponent implements OnInit {
  availableDistributions = new Set<string>();
  selectedDistributions = new Set<string>();

  availableStates = new Set<string>();
  selectedStates = new Set<string>();

  availableTargets = new Set<string>();
  selectedTargets = new Set<string>();

  availableCreators = new Set<string>();
  selectedCreators = new Set<string>();

  highlighted: Bundle;

  bundles: Bundle[] = [];

  username = "chlu";

  constructor(private bundleListService: BundleListService, private router: Router) {}

  ngOnInit() {
    this.bundleListService.cast.subscribe(bundles => this.update(bundles));
    this.bundleListService.update();
  }

  update(bundles) {
    this.bundles = bundles;
    const wasEmpty =
      this.availableCreators.size === 0 &&
      this.availableDistributions.size === 0 &&
      this.availableStates.size === 0 &&
      this.availableTargets.size === 0;
    this.availableCreators = this.bundleListService.getAvailableUserOrOthers(
      this.username
    );
    this.availableDistributions = this.bundleListService.getAvailableDistributions();
    this.availableTargets = this.bundleListService.getAvailableTargets();
    this.availableStates = new Set<string>();
    this.bundleListService
      .getAvailableReadonly()
      .forEach(ro => this.availableStates.add(ro ? "Readonly" : "Editable"));
    if (wasEmpty) {
      this.selectedCreators = new Set(this.availableCreators);
      this.selectedDistributions = new Set(this.availableDistributions);
      this.selectedStates = new Set(this.availableStates);
      this.selectedTargets = new Set(this.availableTargets);
    }
  }

  getBundles(): Bundle[] {
    return this.bundles
      .filter(b => this.selectedDistributions.has(b.distribution))
      .filter(b => this.selectedTargets.has(b.target))
      .filter(b =>
        this.selectedStates.has(b.readonly ? "Readonly" : "Editable")
      )
      .filter(b =>
        this.selectedCreators.has(
          this.bundleListService.getUserOrOthers(this.username, b)
        )
      );
  }

  navigateTo(bundle): void {
    this.router.navigate(['/view/', bundle.name.replace('/', '-')]);
  }
}
