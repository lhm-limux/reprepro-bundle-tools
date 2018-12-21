import { HttpParams, HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { AuthType, AuthRef, AuthRequired } from "./interfaces";
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
  private tmpKeys = new Map<string, string>();

  callWithRequiredAuthentications(
    actionId: string,
    action: (refs: AuthRef[]) => void
  ): void {
    const defaultUsers = this.getDefaultUsers();

    const authRequired: AuthRequired = {
      actionId: actionId,
      refs: []
    };
    this.knownAuthRefs.forEach((value, key) => {
      authRequired.refs.push(value);
    });
    const params = new HttpParams().set(
      "authRequired",
      JSON.stringify(authRequired)
    );

    this.http
      .get<AuthType[]>(this.config.getApiUrl("requiredAuth"), {
        params: params
      })
      .subscribe(
        (data: AuthType[]) => {
          if (data.length > 0) {
            this.dialogService
              .createExtraAuthModal(data, defaultUsers)
              .subscribe((authData: AuthData[]) => {
                if (authData) {
                  this.storeCredentials(authData).subscribe(
                    (refs: AuthRef[]) => {
                      refs.forEach(r => {
                        r.key = this.tmpKeys.get(r.authId);
                        this.tmpKeys.delete(r.authId);
                        this.knownAuthRefs.set(r.authId, r);
                      });
                      action(Array.from(this.knownAuthRefs.values()));
                    },
                    errResp => {
                      console.error("Store credentials failed: " + errResp);
                    }
                  );
                }
              });
          } else {
            action(Array.from(this.knownAuthRefs.values()));
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
    authData.forEach(auth => {
      refs.push({
        authId: auth.authId,
        user: auth.username,
        storageSlotId: null,
        key: null
      });
      const key = this.genKey();
      this.tmpKeys.set(auth.authId, key);
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
