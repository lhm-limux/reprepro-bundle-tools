import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class ExitBackendService {
  constructor(private http: HttpClient) {}

  exitBackend(): Observable<string> {
    return this.http.get<string>("/api/exit");
  }
}
