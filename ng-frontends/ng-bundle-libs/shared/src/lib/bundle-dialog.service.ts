import { Injectable } from "@angular/core";
import { SimpleModalService } from "ngx-simple-modal";
import { ExtraAuthModalComponent } from "./extra-auth-modal/extra-auth-modal.component";
import { AuthType } from "./interfaces";

@Injectable({
  providedIn: "root"
})
export class BundleDialogService {
  constructor(private modalService: SimpleModalService) {}

  createExtraAuthModal(
    authTypes: AuthType[],
    defaultUsers: Map<string, string> = new Map(),
    message: string = ""
  ) {
    return this.modalService.addModal(ExtraAuthModalComponent, {
      title: "Authentication required…",
      message: message,
      authTypes: authTypes,
      defaultUsers: defaultUsers
    });
  }
}
