import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { WorkflowMetadata, ManagedBundle, ManagedBundleInfo } from "shared";
import { ManagedBundleService } from "../services/managed-bundle.service";
import { WorkflowMetadataService } from "../services/workflow-metadata.service";
import { BundleComposeActionService } from "../services/bundle-compose-action.service";

@Component({
  selector: "app-managed-bundle-editor",
  templateUrl: "./managed-bundle-editor.component.html",
  styleUrls: ["./managed-bundle-editor.component.css"]
})
export class ManagedBundleEditorComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  bundlename: string;
  info: ManagedBundleInfo = {
    basedOn: "",
    creator: "",
    managedBundle: {
      distribution: "",
      id: "",
      status: null,
      target: "",
      ticket: "",
      ticketUrl: ""
    },
    subject: "-- No Subject --"
  };
  private workflow: WorkflowMetadata[] = [];
  hoveredStatus: WorkflowMetadata = null;

  @ViewChild("targetSelect")
  targetSelect;

  constructor(
    private route: ActivatedRoute,
    private bundleService: ManagedBundleService,
    private workflowMetadataService: WorkflowMetadataService,
    public actionService: BundleComposeActionService
  ) {
    this.subscriptions.push(
      this.workflowMetadataService.castWorkflowMetadata.subscribe(
        data => (this.workflow = data)
      )
    );
    this.subscriptions.push(
      this.route.params.subscribe(p => {
        this.bundlename = "bundle:" + p["dist"] + "/" + p["id"];
        this.update();
      })
    );
    this.workflowMetadataService.update();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.actionService.cast.subscribe(data => {
        this.bundleService.update();
      })
    );
    this.subscriptions.push(
      this.bundleService.cast.subscribe(() => this.update())
    );
    this.bundleService.update();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  getVisibleWorkflow(): WorkflowMetadata[] {
    return this.workflow.filter(s => s.name !== "UNKNOWN");
  }

  markForStatus(s): void {
    this.actionService.markForStatus(s, [this.info.managedBundle]);
  }

  setTarget(): void {
    const sel = this.targetSelect.nativeElement;
    const newTarget = sel.options[sel.selectedIndex].value;
    this.actionService.setTarget(newTarget, [this.info.managedBundle]);
  }

  update(): void {
    const info = this.bundleService.getManagedBundleInfo(this.bundlename);
    if (info != null) {
      this.info = info;
    }
  }
}
