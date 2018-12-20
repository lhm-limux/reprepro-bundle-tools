import { HttpParams, HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { AuthType, AuthRef } from "./interfaces";
import { BundleDialogService } from "./bundle-dialog.service";
import { AuthData } from "./extra-auth-modal/extra-auth-modal.component";

@Injectable({
  providedIn: "root"
})
export class AuthenticationService {
  constructor(
    private dialogService: BundleDialogService,
    private config: ConfigService,
    private http: HttpClient
  ) {}

  private knownAuthRefs = new Map<string, AuthRef>();
  private knownKeys = new Map<string, string>();

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
              .subscribe((authData: AuthData[]) => {
                if (authData) {
                  this.storeCredentials(authData).subscribe(
                    (refs: AuthRef[]) => {
                      refs.forEach(r => this.knownAuthRefs.set(r.authId, r));
                      action();
                    },
                    errResp => {
                      console.error(
                        "Store credentials failed: " + errResp
                      );
                    }
                  );
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

  private storeCredentials(authData: AuthData[]) {
    const refs: AuthRef[] = [];
    const pwds: string[] = [];
    const keys: string[] = [];
    authData.forEach(auth => {
      refs.push({
        authId: auth.authId,
        user: auth.username,
        storageSlotId: null
      });
      const key = this.genKey();
      this.knownKeys.set(auth.authId, key);
      pwds.push(this.encrypt(auth.password, key));
    });
    const params = new HttpParams()
      .set("refs", JSON.stringify(refs))
      .set("pwds", JSON.stringify(pwds));
    return this.http.get<AuthRef[]>(this.config.getApiUrl("storeCredentials"), {
      params: params
    });
  }

  getDefaultUsers() {
    const defaultUsers = new Map<string, string>();
    this.knownAuthRefs.forEach((value, key) => {
      defaultUsers.set(key, value.user || "");
    });
    return defaultUsers;
  }

  private genKey(): string {
    let key = crypto.getRandomValues(new Uint8Array(32));
    return Array.prototype.map
      .call(key, b => ("0" + b.toString(16)).slice(-2))
      .join("");
  }

  private encrypt(text: string, key: string): string {
    return "encrypted:" + text;
  }
}
