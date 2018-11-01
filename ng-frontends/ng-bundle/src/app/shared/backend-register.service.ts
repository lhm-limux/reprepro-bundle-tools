import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { v4 as uuid } from "uuid";

@Injectable({
  providedIn: "root"
})
export class BackendRegisterService {
  private uuid = uuid();

  constructor(private config: ConfigService, private http: HttpClient) {}

  registerOnBackend() {
    const params = new HttpParams().set("uuid", this.uuid);
    this.http
      .get<string>(this.config.getApiUrl("register"), {
        params: params
      })
      .subscribe(res => {
        if (res === "registered") {
          console.log("registered on the backend");
        }
      });
  }

  unregisterFromBackend() {
    const params = new HttpParams().set("uuid", this.uuid);
    this.http
      .get<string>(this.config.getApiUrl("unregister"), {
        params: params
      })
      .subscribe(res => {
        if (res === "unregistered") {
          console.log("unregistered from the backend");
        }
      });
  }
}
