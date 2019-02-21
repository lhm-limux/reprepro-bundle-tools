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

import { Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy } from "@angular/core";
import localeDe from "@angular/common/locales/de";
import { registerLocaleData } from "@angular/common";
import { Subscription } from "rxjs";
import {
  BackendRegisterService,
  MessagesService,
  BackendLogEntry
} from "shared";

registerLocaleData(localeDe, "de");

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public logs: BackendLogEntry[] = [];
  public spinners: string[] = [];

  title = "ng-bundle-compose";
  hlB = false;

  constructor(
    private backend: BackendRegisterService,
    private messages: MessagesService
  ) {
    this.subscriptions.push(
      this.messages.msgChanged.subscribe(data => (this.logs = data))
    );
    this.subscriptions.push(
      this.messages.spinnerChanged.subscribe(data => {
        this.spinners = data;
        console.log("received " + JSON.stringify(this.spinners));
      })
    );
  }

  ngOnInit(): void {
    this.backend.registerOnBackend();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.backend.unregisterFromBackend();
  }

  @HostListener("window:beforeunload", ["$event"])
  private _storeSettings($event: any = null): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.backend.unregisterFromBackend();
  }
}
