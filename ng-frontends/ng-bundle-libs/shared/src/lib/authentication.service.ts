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
    const defaultUsers = this.getDefaultUsers();
    const params = new HttpParams().set("action", actionId);
    this.http
      .get<AuthType[]>(this.config.getApiUrl("requiredAuth"), {
        params: params
      })
      .subscribe(
        (data: AuthType[]) => {
          if (data.length > 0) {
            this.dialogService
              .createExtraAuthModal(actionMessage, data, defaultUsers)
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

  getDefaultUsers() {
    const defaultUsers = new Map<string, string>();
    // TODO: this is just a mock value. Read/write value from/to local storage
    defaultUsers.set("ldap", "christoph.lutz");
    return defaultUsers;
  }
}
