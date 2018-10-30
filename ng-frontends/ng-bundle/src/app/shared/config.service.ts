import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor() {}

  private apiBase = "/api";
  //private apiBase = "//0.0.0.0:8081/api";

  getApiUrl(functionName): string {
    return "http:" + this.apiBase + "/" + functionName;
  }

  getWebsocketUrl(channel): string {
    return "ws:" + this.apiBase + "/" + channel;
  }

  isElectronApp(): boolean {
    return false;
  }
}
