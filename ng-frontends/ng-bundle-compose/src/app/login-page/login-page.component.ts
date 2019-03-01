import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";
import { AuthenticationService, AuthRef, BackendLogEntry } from "shared";

@Component({
  selector: "app-login-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.css"]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  public autologin = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authenticationService: AuthenticationService,
    public actionService: BundleComposeActionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.subscriptions.push(
      this.actionService.cast.subscribe(data => {
        this.update();
      })
    );
    this.subscriptions.push(
      this.route.queryParams.subscribe(p => {
        this.autologin = p["autologin"] || true;
        this.update();
      })
    );
  }

  ngOnInit(): void {}

  update(): void {
    this.actionService.validateSession().subscribe(
      (data: BackendLogEntry[]) => {
        this.router.navigate(["/workflow-status-editor"]);
      },
      errResp => {
        if (this.autologin === true) {
          this.login();
        }
      }
    );
  }

  login() {
    this.authenticationService.callWithRequiredAuthentications(
      "login",
      (refs: AuthRef[]) => {
        this.autologin = false;
        this.actionService.login(refs);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
