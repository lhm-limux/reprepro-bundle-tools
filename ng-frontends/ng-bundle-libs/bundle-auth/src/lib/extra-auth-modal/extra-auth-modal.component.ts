import { Component, OnInit } from "@angular/core";
import { SimpleModalComponent } from "ngx-simple-modal";
import { AuthType } from "../interfaces";

export interface ExtraAuthArgs {
  title: string;
  message: string;
  authTypes: AuthType[];
  defaultUsers: Map<string, string>;
}

export interface AuthData {
  authId: string;
  requiredFor: string[];
  username: string;
  password: string;
}

@Component({
  selector: "extra-auth-modal",
  templateUrl: "./extra-auth-modal.component.html",
  styleUrls: ["./extra-auth-modal.component.css"]
})
export class ExtraAuthModalComponent
  extends SimpleModalComponent<ExtraAuthArgs, AuthData[]>
  implements ExtraAuthArgs, OnInit {
  authData: AuthData[] = [];

  defaultUsers: Map<string, string>;
  authTypes: AuthType[];
  title: string;
  message: string;

  constructor() {
    super();
  }

  confirmOnEnter(event) {
    if (event.code == "Enter" || event.keyCode == 13) {
      this.confirm();
    }
  }

  confirm() {
    this.result = this.authData;
    this.close();
  }

  ngOnInit(): void {
    // clustering AuthType[] by authId
    const authMap = new Map<string, AuthData>();
    this.authTypes.forEach(t => {
      let e = authMap.get(t.authId) || {
        authId: t.authId,
        username: this.defaultUsers.get(t.authId) || "",
        password: "",
        requiredFor: []
      };
      e.requiredFor.push(t.requiredFor);
      authMap.set(t.authId, e);
    });
    this.authData = [];
    for (let entry of Array.from(authMap.entries()).sort()) {
      this.authData.push(entry[1]);
    }
  }
}
