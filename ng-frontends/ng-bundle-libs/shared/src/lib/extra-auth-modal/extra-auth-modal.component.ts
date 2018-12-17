import { Component, OnInit } from "@angular/core";
import { DialogComponent, DialogService } from "ng2-bootstrap-modal";
export interface ExtraAuthArgs {
  title: string;
  message: string;
}
@Component({
  templateUrl: "./extra-auth-modal.component.html",
  styleUrls: ["./extra-auth-modal.component.css"]
})
export class ExtraAuthModalComponent extends DialogComponent<ExtraAuthArgs, boolean> implements ExtraAuthArgs {
  title: string;
  message: string;

  constructor(dialogService: DialogService) {
    super(dialogService);
  }

  confirm() {
    this.result = true;
    this.close();
  }
}
