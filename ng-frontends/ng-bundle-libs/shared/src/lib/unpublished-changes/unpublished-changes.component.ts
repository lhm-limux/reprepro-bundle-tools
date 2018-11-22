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
