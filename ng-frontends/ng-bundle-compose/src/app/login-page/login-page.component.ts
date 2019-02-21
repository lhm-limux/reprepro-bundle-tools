import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";
import { AuthenticationService, AuthRef } from "shared";

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
        if (data.length > 0) {
          this.router.navigate(["/workflow-status-editor"]);
        }
      })
    );
  }

  ngOnInit() {
    this.authenticationService.callWithRequiredAuthentications(
      "login",
      (refs: AuthRef[]) => {
        this.actionService.login(refs);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
