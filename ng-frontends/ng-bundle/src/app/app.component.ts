import { Component, Inject } from "@angular/core";
import { ExitBackendService } from "./exit-backend.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  title = "ng-bundle";
  hlX = false;
  hlB = false;

  constructor(
    private exitBackendService: ExitBackendService,
    @Inject("windowObject") public window: Window
  ) {}

  closeBackend() {
    this.exitBackendService.exitBackend().subscribe(res => {
      if (res === "exiting") {
        console.log("Backend is closing now!");
        if (this.window) {
          console.log("Closing Window now.");
          console.log("Solution for Firefox if this doesn't work: do 'about:config' and set 'allow_scripts_to_close_windows' to true");
          this.window.close();
        } else {
          console.log("Can't close window as no Window Object is available");
        }
      }
    });
  }
}
