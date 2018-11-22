import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "lib-fontawsome-toggle-button",
  templateUrl: "./fontawsome-toggle-button.component.html",
  styleUrls: ["./fontawsome-toggle-button.component.css"]
})
export class FontawsomeToggleButtonComponent {
  hovered = false;

  @Input()
  status = false;

  @Input()
  titleOn: string;

  @Input()
  titleOff: string;

  @Input()
  symbolOn: string;

  @Input()
  symbolOff: string;

  @Output()
  statusChange = new EventEmitter<boolean>();

  constructor() {}

  setStatus(status: boolean) {
    this.status = status;
    this.statusChange.next(status);
  }
}
