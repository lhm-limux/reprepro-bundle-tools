import { AuthenticationService } from "./../authentication.service";
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "lib-known-auth-badge",
  templateUrl: "./known-auth-badge.component.html",
  styleUrls: ["./known-auth-badge.component.css"]
})
export class KnownAuthBadgeComponent implements OnInit {
  @Input()
  authId: string;

  @Input()
  user: string;

  @Output()
  forget = new EventEmitter<string>();

  constructor() {}

  emitForget(authId: string) {
    this.forget.next(authId);
  }

  ngOnInit() {}
}
