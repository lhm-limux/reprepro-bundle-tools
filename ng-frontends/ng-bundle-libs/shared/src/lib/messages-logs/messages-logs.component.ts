import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { BackendLogEntry } from "../interfaces";
import { MessagesService } from "../messages.service";

@Component({
  selector: "lib-messages-logs",
  templateUrl: "./messages-logs.component.html",
  styleUrls: ["./messages-logs.component.css"]
})
export class MessagesLogsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  public logs: BackendLogEntry[] = [];

  constructor(private messages: MessagesService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.messages.msgChanged.subscribe(data => (this.logs = data))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
