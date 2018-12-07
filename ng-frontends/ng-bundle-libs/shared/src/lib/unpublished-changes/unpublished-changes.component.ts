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

import { Component, Input, Output, EventEmitter } from "@angular/core";
import { VersionedChange } from '../interfaces';

@Component({
  selector: "lib-unpublished-changes",
  templateUrl: "./unpublished-changes.component.html",
  styleUrls: ["./unpublished-changes.component.css"]
})
export class UnpublishedChangesComponent {
  changelogVisible = false;

  @Input()
  changes: VersionedChange[];

  @Output()
  undoLastChange = new EventEmitter<void>();

  @Output()
  publish = new EventEmitter<void>();

  emitUndoLastChange() {
    this.undoLastChange.next();
  }

  emitPublish() {
    this.publish.next();
  }

  getUnpublishedChanges(): VersionedChange[] {
    return this.changes.filter(c => !c.published);
  }

  hasUnpublished(): boolean {
    return this.getUnpublishedChanges().length > 0;
  }
}
