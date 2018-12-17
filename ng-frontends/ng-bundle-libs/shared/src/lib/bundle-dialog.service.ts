import { ExtraAuthModalComponent } from './extra-auth-modal/extra-auth-modal.component';
import { DialogService } from 'ng2-bootstrap-modal';
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class BundleDialogService {
  constructor(private dialogService: DialogService) {}

  createExtraAuthModal(message: string) {
    return this.dialogService.addDialog(
      ExtraAuthModalComponent,
      {
        title: "Authentication required...",
        message: message
      },
      {
        backdropColor: "rgba(70, 70, 70, 0.5)"
      }
    );
  }
}
