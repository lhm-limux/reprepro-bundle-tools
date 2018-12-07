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
