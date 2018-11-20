import { VersionedChangesService } from './../versioned-changes.service';
import { Component, Input } from "@angular/core";
import { Subscription } from 'rxjs';
import { VersionedChange } from '../interfaces';

@Component({
  selector: "lib-unpublished-changes",
  templateUrl: "./unpublished-changes.component.html",
  styleUrls: ["./unpublished-changes.component.css"]
})
export class UnpublishedChangesComponent {
  showChangelog = false;

  @Input()
  unpublishedChanges: VersionedChange[];

  undoLastChange() {

  }

  publish() {

  }
}
