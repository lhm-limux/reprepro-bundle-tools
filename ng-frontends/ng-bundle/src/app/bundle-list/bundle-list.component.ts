import { BundleListService } from "./bundle-list.service";
import { ServerLogComponent } from "./../server-log/server-log.component";
import {
  Component,
  OnInit,
  SystemJsNgModuleLoader,
  HostListener
} from "@angular/core";
import { Bundle } from "shared/bundle";
import { Router } from "@angular/router";

@Component({
  selector: "bundle-list",
  templateUrl: "./bundle-list.component.html",
  styleUrls: ["./bundle-list.component.css"]
})
export class BundleListComponent implements OnInit {
  private needInit = true;

  availableDistributions = new Set<string>();
  selectedDistributions = new Set<string>();

  availableStates = new Set<string>();
  selectedStates = new Set<string>();

  availableTargets = new Set<string>();
  selectedTargets = new Set<string>();

  availableCreators = new Set<string>();
  selectedCreators = new Set<string>();

  bundles: Bundle[] = [];
  highlighted: Bundle;

  username = "chlu";

  constructor(
    private bundleListService: BundleListService,
    private router: Router
  ) {}

  ngOnInit() {
    this._restoreSettings();
    this.bundleListService.cast.subscribe(bundles => this.update(bundles));
    this.bundleListService.update();
  }

  update(bundles) {
    this.bundles = bundles;
    this.availableCreators = this.bundleListService.getAvailableUserOrOthers(
      this.username
    );
    this.availableDistributions = this.bundleListService.getAvailableDistributions();
    this.availableTargets = this.bundleListService.getAvailableTargets();
    this.availableStates = new Set<string>();
    this.bundleListService
      .getAvailableReadonly()
      .forEach(ro => this.availableStates.add(ro ? "Readonly" : "Editable"));
    if (this.needInit && bundles.length > 0) {
      this.selectedCreators = new Set(this.availableCreators);
      this.selectedDistributions = new Set(this.availableDistributions);
      this.selectedStates = new Set(this.availableStates);
      this.selectedTargets = new Set(this.availableTargets);
      this.needInit = false;
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
    this._storeSettings();
    this.router.navigate([
      "/bundle/",
      bundle.distribution,
      bundle.name.split("/")[1]
    ]);
  }

  @HostListener("window:beforeunload", ["$event"])
  private _storeSettings($event: any = null): void {
    const settings: { [key: string]: string[] } = {};
    settings.selectedCreators = Array.from(this.selectedCreators.values());
    settings.selectedDistributions = Array.from(
      this.selectedDistributions.values()
    );
    settings.selectedStates = Array.from(this.selectedStates.values());
    settings.selectedTargets = Array.from(this.selectedTargets.values());
    localStorage.setItem(
      "stored-bundle-list-settings",
      JSON.stringify(settings)
    );
  }

  private _restoreSettings(): void {
    const stored = localStorage.getItem("stored-bundle-list-settings");
    if (stored == null) {
      return;
    }
    try {
      const settings: { [key: string]: string[] } = JSON.parse(stored);
      this.selectedCreators = new Set<string>(settings.selectedCreators);
      this.selectedDistributions = new Set<string>(
        settings.selectedDistributions
      );
      this.selectedStates = new Set<string>(settings.selectedStates);
      this.selectedTargets = new Set<string>(settings.selectedTargets);
      this.needInit = false;
    } catch (e) {
      console.error(e);
    }
  }
}
