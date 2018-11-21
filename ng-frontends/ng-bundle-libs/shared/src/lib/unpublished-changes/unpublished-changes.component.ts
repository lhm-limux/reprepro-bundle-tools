import { Component, Input } from "@angular/core";
import { VersionedChange } from '../interfaces';

@Component({
  selector: "lib-unpublished-changes",
  templateUrl: "./unpublished-changes.component.html",
  styleUrls: ["./unpublished-changes.component.css"]
})
export class UnpublishedChangesComponent {
  changelogVisible = false;
  mouseOnBurger = false;

  @Input()
  unpublishedChanges: VersionedChange[];

  undoLastChange() {

  }

  publish() {
  }

  onBurger(mouseOver) {
    this.mouseOnBurger = mouseOver;
  }

  showChangelog(visible) {
    this.changelogVisible = visible;
  }
}
