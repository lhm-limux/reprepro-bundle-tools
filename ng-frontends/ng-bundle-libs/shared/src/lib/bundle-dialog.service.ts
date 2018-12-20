import { ExtraAuthModalComponent } from './extra-auth-modal/extra-auth-modal.component';
import { DialogService } from 'ng2-bootstrap-modal';
import { Injectable } from "@angular/core";
import { AuthType } from './interfaces';

@Injectable({
  providedIn: "root"
})
export class BundleDialogService {

  backdropColor = "rgba(0, 0, 0, 0.5)";

  constructor(private dialogService: DialogService) {}

  createExtraAuthModal(authTypes: AuthType[], defaultUsers: Map<string, string> = new Map(), message: string = "") {
    return this.dialogService.addDialog(
      ExtraAuthModalComponent,
      {
        title: "Authentication required…",
        message: message,
        authTypes: authTypes,
        defaultUsers: defaultUsers
      },
      {
        backdropColor: this.backdropColor
      }
    );
  }
}
