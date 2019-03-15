/***********************************************************************
 * Copyright (c) 2018 Landeshauptstadt München
 *           (c) 2018 Christoph Lutz (InterFace AG)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the European Union Public Licence (EUPL),
 * version 1.1 (or any later version).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * European Union Public Licence for more details.
 *
 * You should have received a copy of the European Union Public Licence
 * along with this program. If not, see
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
 ***********************************************************************/

import { Injectable } from "@angular/core";
import {
  ConfigService,
  MessagesService,
  ManagedBundle,
  WorkflowMetadata,
  BackendLogEntry,
  SessionInfo,
  AuthRef
} from "shared";
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse
} from "@angular/common/http";
import { Observable, Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class BundleComposeActionService {
  private successfullAction = new Subject<BackendLogEntry[]>();
  cast = this.successfullAction.asObservable();

  private sessionStatus = new Subject();
  sessionStatusChanged = this.sessionStatus.asObservable();

  constructor(
    private config: ConfigService,
    private messages: MessagesService,
    private http: HttpClient
  ) {}

  login(refs: AuthRef[]): void {
    const sp = this.messages.addSpinner("Logging in…");
    const params = new HttpParams().set("refs", JSON.stringify(refs));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("login"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
          this.messages.setMessages(data);
          this.sessionStatus.next();
          this.successfullAction.next(data);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Login failed", errResp);
          this.sessionStatus.next();
        }
      );
  }

  validateSession(): Observable<SessionInfo> {
    return this.http.get<SessionInfo>(this.config.getApiUrl("validateSession"));
  }

  logout(): void {
    const sp = this.messages.addSpinner("Logging out…");
    this.http.get<BackendLogEntry[]>(this.config.getApiUrl("logout")).subscribe(
      (data: BackendLogEntry[]) => {
        this.messages.unsetSpinner(sp);
        this.messages.setMessages(data);
        this.sessionStatus.next();
      },
      (errResp: HttpErrorResponse) => {
        this.messages.unsetSpinner(sp);
        this.messages.setErrorResponse("Logout failed", errResp);
        this.sessionStatus.next();
      }
    );
  }

  updateBundles(refs: AuthRef[]): void {
    const sp = this.messages.addSpinner("Updating Bundles");
    const params = new HttpParams().set("refs", JSON.stringify(refs));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("updateBundles"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
          this.messages.setMessages(data);
          this.successfullAction.next(data);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Update Bundles failed", errResp);
        }
      );
  }

  markForStatus(status: WorkflowMetadata, bundles: string[]): void {
    const sp = this.messages.addSpinner("Marking For Status");
    const params = new HttpParams()
      .set("status", status.name)
      .set("bundles", JSON.stringify(bundles));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("markForStatus"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
          this.messages.setMessages(data);
          this.successfullAction.next(data);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Mark for stage failed", errResp);
        }
      );
  }

  setTarget(target: string, bundles: ManagedBundle[]): void {
    const sp = this.messages.addSpinner("Set Target");
    const params = new HttpParams()
      .set("target", target)
      .set("bundles", JSON.stringify(bundles.map(b => b.id)));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("setTarget"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
          this.messages.setMessages(data);
          this.successfullAction.next(data);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Set Target failed", errResp);
        }
      );
  }

  undoLastChange(): void {
    const sp = this.messages.addSpinner("Undoing Last Change");
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("undoLastChange"))
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
          this.messages.setMessages(data);
          this.successfullAction.next(data);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Undo last Change failed", errResp);
        }
      );
  }

  publishChanges(refs: AuthRef[]): void {
    const sp = this.messages.addSpinner("Publishing Changes");
    const params = new HttpParams().set("refs", JSON.stringify(refs));
    this.http
      .get<BackendLogEntry[]>(this.config.getApiUrl("publishChanges"), {
        params: params
      })
      .subscribe(
        (data: BackendLogEntry[]) => {
          this.messages.unsetSpinner(sp);
          this.messages.setMessages(data);
          this.successfullAction.next(data);
        },
        (errResp: HttpErrorResponse) => {
          this.messages.unsetSpinner(sp);
          this.messages.setErrorResponse("Publish Changes failed", errResp);
        }
      );
  }
}
