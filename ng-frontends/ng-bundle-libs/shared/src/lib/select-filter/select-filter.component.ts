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
