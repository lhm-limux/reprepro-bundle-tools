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
import { BootstrapModalModule } from "ng2-bootstrap-modal";
import { SelectFilterComponent } from "./select-filter/select-filter.component";
import { UnpublishedChangesComponent } from "./unpublished-changes/unpublished-changes.component";
import { FontawsomeToggleButtonComponent } from "./fontawsome-toggle-button/fontawsome-toggle-button.component";
import { ExtraAuthModalComponent } from "./extra-auth-modal/extra-auth-modal.component";

@NgModule({
  imports: [
    CommonModule,
    BootstrapModalModule.forRoot({
      container: document.body
    })
  ],
  declarations: [
    SelectFilterComponent,
    UnpublishedChangesComponent,
    FontawsomeToggleButtonComponent,
    ExtraAuthModalComponent
  ],
  exports: [
    SelectFilterComponent,
    UnpublishedChangesComponent,
    FontawsomeToggleButtonComponent,
    ExtraAuthModalComponent
  ],
  entryComponents: [ExtraAuthModalComponent]
})
export class SharedModule {}
