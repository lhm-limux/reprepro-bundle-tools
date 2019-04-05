import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";
import { SessionInfo, AuthRef } from "shared";
import { AuthenticationService } from "bundle-auth";

@Component({
  selector: "app-login-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.css"]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  public autologin = null;
  public inAction = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authenticationService: AuthenticationService,
    public actionService: BundleComposeActionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.subscriptions.push(
      this.actionService.sessionStatusChanged.subscribe(() => {
        this.updateSessionStatus();
      })
    );
    this.subscriptions.push(
      this.actionService.cast.subscribe(() => {
        this.inAction = false;
      })
    );
    this.subscriptions.push(
      this.route.queryParams.subscribe(p => {
        if (p["autologin"] === "true") {
          this.autologin = true;
          this.updateSessionStatus();
        }
      })
    );
  }

  ngOnInit(): void {}

  updateSessionStatus(): void {
    this.actionService.validateSession().subscribe(
      (data: SessionInfo) => {
        this.router.navigate(["/workflow-status-editor"]);
      },
      errResp => {
        if (this.autologin) {
          this.login();
        }
      }
    );
  }

  login() {
    this.authenticationService.callWithRequiredAuthentications(
      "login",
      (refs: AuthRef[]) => {
        this.inAction = true;
        this.autologin = null;
        this.actionService.login(refs, () => {
          this.inAction = false;
          this.autologin = null;
        });
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
