import { Component, OnInit } from "@angular/core";
import { DialogComponent, DialogService } from "ng2-bootstrap-modal";
import { AuthType } from "../interfaces";

export interface ExtraAuthArgs {
  title: string;
  message: string;
  authTypes: AuthType[];
  defaultUsers: Map<string, string>;
}

export interface RawCredentials {
  username: string;
  password: string;
}

@Component({
  templateUrl: "./extra-auth-modal.component.html",
  styleUrls: ["./extra-auth-modal.component.css"]
})
export class ExtraAuthModalComponent
  extends DialogComponent<ExtraAuthArgs, boolean>
  implements ExtraAuthArgs {
  private credentials = new Map<string, RawCredentials>();

  defaultUsers: Map<string, string>;
  authTypes: AuthType[];
  title: string;
  message: string;

  constructor(dialogService: DialogService) {
    super(dialogService);
  }

  confirm() {
    this.result = true;
    this.close();
  }

  // returns a list of AuthType[], clustered by authId
  getRequiredAuths(): {
    authId: string;
    cred: RawCredentials;
    requiredFor: string[];
  }[] {
    const authMap = new Map<
      string,
      { authId: string; cred: RawCredentials; requiredFor: string[] }
    >();
    this.authTypes.forEach(t => {
      let e = authMap.get(t.authId) || {
        authId: t.authId,
        cred: this.getCredentials(t),
        requiredFor: []
      };
      e.requiredFor.push(t.requiredFor);
      authMap.set(t.authId, e);
    });
    const res = [];
    for (let entry of Array.from(authMap.entries()).sort()) {
      res.push(entry[1]);
    }
    return res;
  }

  getCredentials(auth: AuthType): RawCredentials {
    const res = this.credentials.get(auth.authId) || {
      username: this.defaultUsers.get(auth.authId),
      password: ""
    };
    console.log(JSON.stringify(res));
    this.credentials.set(auth.authId, res);
    return res;
  }

  getUser(auth: AuthType) {
    return this.getCredentials(auth).username;
  }

  setUser(auth: AuthType, username: string) {
    const cred = this.getCredentials(auth);
    cred.username = username;
    this.credentials.set(auth.authId, cred);
  }

  getPwd(auth: AuthType) {
    return this.getCredentials(auth).password;
  }

  setPwd(auth: AuthType, password: string) {
    const cred = this.getCredentials(auth);
    cred.password = password;
    this.credentials.set(auth.authId, cred);
  }
}
