import { NgModule } from "@angular/core";
import { SimpleModalModule } from "ngx-simple-modal";
import { SharedModule } from "shared";
import { defaultSimpleModalOptions } from "ngx-simple-modal/dist/simple-modal/simple-modal-options";
import { BundleAuthComponent } from "./bundle-auth.component";
import { ExtraAuthModalComponent } from "./extra-auth-modal/extra-auth-modal.component";
import { KnownAuthBadgeComponent } from "./known-auth-badge/known-auth-badge.component";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SimpleModalModule.forRoot(
      {
        container: document.body
      },
      {
        ...defaultSimpleModalOptions,
        ...{
          closeOnEscape: true,
          closeOnClickOutside: false
        }
      }
    )
  ],
  declarations: [
    BundleAuthComponent,
    ExtraAuthModalComponent,
    KnownAuthBadgeComponent
  ],
  exports: [
    BundleAuthComponent,
    ExtraAuthModalComponent,
    KnownAuthBadgeComponent
  ],
  entryComponents: [ExtraAuthModalComponent]
})
export class BundleAuthModule {}
