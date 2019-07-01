import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "app-ticket-reference",
  templateUrl: "./ticket-reference.component.html",
  styleUrls: ["./ticket-reference.component.css"]
})
export class TicketReferenceComponent implements OnInit {
  @Input()
  ticket: string;

  @Input()
  tracUrl: string;

  constructor() {}

  ngOnInit() {}
}
