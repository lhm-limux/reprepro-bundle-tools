import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";
import { AuthenticationService, AuthRef, BackendLogEntry } from "shared";

@Component({
  selector: "app-login-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.css"]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    private authenticationService: AuthenticationService,
    public actionService: BundleComposeActionService,
    private router: Router
  ) {
    this.subscriptions.push(
      this.actionService.cast.subscribe(data => {
        this.update();
      })
    );
  }

  ngOnInit() {
    this.update();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  update() {
    this.actionService.validateSession().subscribe(
      (data: BackendLogEntry[]) => {
        this.router.navigate(["/workflow-status-editor"]);
      },
      errResp => {
        this.authenticationService.callWithRequiredAuthentications(
          "login",
          (refs: AuthRef[]) => {
            this.actionService.login(refs);
          }
        );
      }
    );
  }
}
