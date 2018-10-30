import { Injectable } from "@angular/core";
import { Socket } from "socket.io";
import { Observer, Observable } from "rxjs";
import { ConfigService } from "../shared/config.service";

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
