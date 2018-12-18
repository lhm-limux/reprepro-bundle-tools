import { HttpParams, HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { AuthType, AuthRef } from "./interfaces";
import { BundleDialogService } from "./bundle-dialog.service";

@Injectable({
  providedIn: "root"
})
export class AuthenticationService {
  constructor(
    private dialogService: BundleDialogService,
    private config: ConfigService,
    private http: HttpClient
  ) {}

  private availableCredentials = new Map<string, AuthRef>();

  ensureAuthentications(
    actionMessage: string,
    actionId: string,
    action: () => void
  ): void {
    const params = new HttpParams().set("action", actionId);
    this.http
      .get<AuthType[]>(this.config.getApiUrl("requiredAuth"), {
        params: params
      })
      .subscribe(
        (data: AuthType[]) => {
          if (data.length > 0) {
            this.dialogService
              .createExtraAuthModal(actionMessage)
              .subscribe(isConfirmed => {
                if (isConfirmed) {
                  action();
                }
              });
          } else {
            action();
          }
        },
        errResp => {
          console.error("Get required authentications failed: " + errResp);
        }
      );
  }
}
