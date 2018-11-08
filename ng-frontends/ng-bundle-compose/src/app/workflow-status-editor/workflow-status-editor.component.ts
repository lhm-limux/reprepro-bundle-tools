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
  configuredStages: string[] = [];
  highlighted: WorkflowMetadata;

  availableWorkflow = ['Show Stages and Candidates', 'Show Others', 'Hide Empty Steps'];
  selectedWorkflow = new Set<string>();

  constructor(
    private workflowMetadataService: WorkflowMetadataService,
    private router: Router
  ) {}

  ngOnInit() {
    this._restoreSettings()
    this.workflowMetadataService.castWorkflowMetadata.subscribe(data => this.workflowMetadata = data);
    this.workflowMetadataService.castConfiguredStages.subscribe(data => this.configuredStages = data);
    this.workflowMetadataService.update();
  }

  getWorkflow() {
    return this.workflowMetadata.filter(st => st.name != "UNKNOWN");
  }

  isValidStage(status: WorkflowMetadata) {
    return status.stage && this.configuredStages.indexOf(status.stage) >= 0;
  }

  candidateForStages(status: WorkflowMetadata) {
    return this.workflowMetadata.filter(st => this.isValidStage(st) && st.candidates == status.name);
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
