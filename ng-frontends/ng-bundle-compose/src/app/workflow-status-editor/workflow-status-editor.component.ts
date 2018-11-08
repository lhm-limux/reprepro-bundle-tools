import { Component, OnInit, HostListener } from "@angular/core";
import { WorkflowMetadata, SelectFilterComponent } from "shared";
import { WorkflowMetadataService } from "./workflow-metadata.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-workflow-status-editor",
  templateUrl: "./workflow-status-editor.component.html",
  styleUrls: ["./workflow-status-editor.component.css"]
})
export class WorkflowStatusEditorComponent implements OnInit {
  workflowMetadata: WorkflowMetadata[] = [];
  highlighted: WorkflowMetadata;

  availableWorkflow = ['Show Stages and Candidates', 'Show Others', 'Hide Empty Steps'];
  selectedWorkflow = new Set<string>();

  constructor(
    private workflowMetadataService: WorkflowMetadataService,
    private router: Router
  ) {}

  ngOnInit() {
    this._restoreSettings()
    this.workflowMetadataService.cast.subscribe(workflowMetadata => this.update(workflowMetadata));
    this.workflowMetadataService.update();
  }

  update(workflowMetadata) {
    this.workflowMetadata = workflowMetadata;
  }

  getWorkflow() {
    return this.workflowMetadata.filter(st => st.name != "UNKNOWN");
  }

  @HostListener("window:beforeunload", ["$event"])
  private _storeSettings($event: any = null): void {
    const settings: { [key: string]: string[] } = {};
    settings.selectedWorkflow = Array.from(this.selectedWorkflow.values());
    localStorage.setItem(
      "stored-workflow-status-editor-settings",
      JSON.stringify(settings)
    );
  }

  private _restoreSettings(): void {
    const stored = localStorage.getItem("stored-workflow-status-editor-settings");
    if (stored == null) {
      return;
    }
    try {
      const settings: { [key: string]: string[] } = JSON.parse(stored);
      this.selectedWorkflow = new Set<string>(settings.selectedWorkflow);
    } catch (e) {
      console.error(e);
    }
  }
}
