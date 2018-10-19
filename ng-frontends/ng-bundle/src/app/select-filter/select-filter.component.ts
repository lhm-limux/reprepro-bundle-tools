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

  ngOnInit() {
    this.values.forEach(v => this.selected.add(v));
  }

  toggle(value) {
    if (this.selected.has(value)) {
      this.selected.delete(value);
    } else {
      this.selected.add(value);
    }
    this.selectedChange.next(this.selected);
  }
}
