import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { BackendRegisterService } from "shared";
import localeDe from "@angular/common/locales/de";
import { registerLocaleData } from "@angular/common";

registerLocaleData(localeDe, "de");

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit, OnDestroy {
  title = "ng-bundle-compose";
  hlB = false;

  constructor(private backend: BackendRegisterService) {}

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
