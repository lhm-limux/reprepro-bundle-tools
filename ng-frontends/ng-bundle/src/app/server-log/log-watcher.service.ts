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
import { Socket } from "socket.io";
import { Observer, Observable } from "rxjs";
import { ConfigService } from "shared";

@Injectable({
  providedIn: "root"
})
export class LogWatcherService {
  socket: Socket;
  observer: Observer<string>;

  constructor(private config: ConfigService) {}

  getLog(): Observable<string> {
    this.socket = new WebSocket(this.config.getWebsocketUrl("log"));
    this.socket.onopen = event => {
      // Send an initial message
      this.socket.send("I am the client and I'm listening!");

      // Listen for messages
      this.socket.onmessage = event => {
        console.log("Client received a message", event);
        this.observer.next(event.data);
      };

      // Listen for socket closes
      this.socket.onclose = event => {
        console.log("Client notified socket has closed", event);
      };

      // To close the socket....
      //socket.close()
    };

    return this.createObservable();
  }

  createObservable(): Observable<string> {
    return new Observable(observer => {
      this.observer = observer;
    });
  }
}
