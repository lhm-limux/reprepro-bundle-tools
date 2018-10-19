import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'select-filter',
  templateUrl: './select-filter.component.html',
  styles: []
})
export class SelectFilterComponent implements OnInit {

  constructor() { }

  @Input() field: string;
  @Input() name: string;
  @Input() selected: boolean;
  @Output() selectedChange = new EventEmitter<boolean>();

  ngOnInit() {
  }

  select() {
      this.selected = true;
      this.selectedChange.next(this.selected);
  }

  deselect() {
      this.selected = false;
      this.selectedChange.next(this.selected);
  }

}
