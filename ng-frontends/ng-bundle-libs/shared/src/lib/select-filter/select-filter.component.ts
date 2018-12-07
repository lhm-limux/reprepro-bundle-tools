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

import { Component, OnInit, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "select-filter",
  templateUrl: "./select-filter.component.html",
  styles: []
})
export class SelectFilterComponent implements OnInit {
  constructor() {}

  @Input()
  field: string;
  @Input()
  values: string[];
  @Input()
  selected: Set<string> = new Set();
  @Output()
  selectedChange = new EventEmitter<Set<string>>();

  ngOnInit() {}

  toggle(value) {
    if (this.selected.has(value)) {
      this.selected.delete(value);
    } else {
      this.selected.add(value);
    }
    // cleanup no more available values
    for (let v of this.selected) {
      if (this.values.indexOf(v) < 0) {
        this.selected.delete(v);
      }
    }
    this.selectedChange.next(this.selected);
  }
}
