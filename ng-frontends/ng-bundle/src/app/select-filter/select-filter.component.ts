import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'select-filter',
  templateUrl: './select-filter.component.html',
  styles: []
})
export class SelectFilterComponent implements OnInit {

  constructor() { }

  @Input() field: string;
  @Input() values: string[];
  @Input() selected: Set<string> = new Set();
  @Output() selectedChange = new EventEmitter<Set<string>>();

  ngOnInit() {
    this.values.forEach((v) => this.select(v));
  }

  select(value) {
      this.selected.add(value);
      this.selectedChange.next(this.selected);
  }

  deselect(value) {
      this.selected.delete(value);
      this.selectedChange.next(this.selected);
  }

}
