/***********************************************************************
 * Copyright (c) 2018 Landeshauptstadt München
 *           (c) 2018 Christoph Lutz (InterFace AG)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the European Union Public Licence (EUPL),
 * version 1.1 (or any later version).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * European Union Public Licence for more details.
 *
 * You should have received a copy of the European Union Public Licence
 * along with this program. If not, see
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
 ***********************************************************************/

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SimpleModalModule, SimpleModalOptions } from "ngx-simple-modal";
import { defaultSimpleModalOptions } from "ngx-simple-modal/dist/simple-modal/simple-modal-options";
import { SelectFilterComponent } from "./select-filter/select-filter.component";
import { UnpublishedChangesComponent } from "./unpublished-changes/unpublished-changes.component";
import { FontawsomeToggleButtonComponent } from "./fontawsome-toggle-button/fontawsome-toggle-button.component";
import { ExtraAuthModalComponent } from "./extra-auth-modal/extra-auth-modal.component";
import { KnownAuthBadgeComponent } from "./known-auth-badge/known-auth-badge.component";

@NgModule({
  imports: [
    CommonModule,
    SimpleModalModule.forRoot(
      {
        container: document.body
      },
      {
        ...defaultSimpleModalOptions,
        ...{
          closeOnEscape: true,
          closeOnClickOutside: false,
        }
      }
    )
  ],
  declarations: [
    SelectFilterComponent,
    UnpublishedChangesComponent,
    FontawsomeToggleButtonComponent,
    ExtraAuthModalComponent,
    KnownAuthBadgeComponent
  ],
  exports: [
    SelectFilterComponent,
    UnpublishedChangesComponent,
    FontawsomeToggleButtonComponent,
    ExtraAuthModalComponent,
    KnownAuthBadgeComponent
  ],
  entryComponents: [ExtraAuthModalComponent]
})
export class SharedModule {}
