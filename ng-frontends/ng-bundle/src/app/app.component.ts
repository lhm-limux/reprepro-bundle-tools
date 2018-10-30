import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { BackendRegisterService } from "./backend-register.service";
import { ConfigService } from "shared/config.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit, OnDestroy {
  title = "ng-bundle";
  hlX = false;
  hlB = false;

  constructor(
    private config: ConfigService,
    private backend: BackendRegisterService
  ) {}

  ngOnInit(): void {
    this.backend.registerOnBackend();
  }

  ngOnDestroy(): void {
    this.backend.unregisterFromBackend();
  }

  @HostListener("window:beforeunload", ["$event"])
  private _storeSettings($event: any = null): void {
    this.backend.unregisterFromBackend();
  }
}
