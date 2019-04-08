import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { MessagesService } from "../messages.service";

@Component({
  selector: "lib-messages-spinners",
  templateUrl: "./messages-spinners.component.html",
  styleUrls: ["./messages-spinners.component.css"]
})
export class MessagesSpinnersComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  public spinners: string[] = [];

  constructor(private messages: MessagesService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.messages.spinnerChanged.subscribe(data => {
        this.spinners = data;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
