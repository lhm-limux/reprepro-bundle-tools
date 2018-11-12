import { Component, OnInit, HostListener } from "@angular/core";
import { WorkflowMetadata, SelectFilterComponent } from "shared";
import { WorkflowMetadataService } from "./workflow-metadata.service";
import { Router } from "@angular/router";

const STAGES_AND_CANDIDATES = "Stages And Candidates";
const OTHERS = "Others";

@Component({
  selector: "app-workflow-status-editor",
  templateUrl: "./workflow-status-editor.component.html",
  styleUrls: ["./workflow-status-editor.component.css"]
})
export class WorkflowStatusEditorComponent implements OnInit {
  workflowMetadata: WorkflowMetadata[] = [];
  configuredStages: string[] = [];
  highlighted: WorkflowMetadata;

  availableWorkflow = [STAGES_AND_CANDIDATES, OTHERS];
  selectedWorkflow = new Set<string>();

  constructor(
    private workflowMetadataService: WorkflowMetadataService,
    private router: Router
  ) {}

  ngOnInit() {
    this._restoreSettings();
    this.workflowMetadataService.castWorkflowMetadata.subscribe(
      data => (this.workflowMetadata = data)
    );
    this.workflowMetadataService.castConfiguredStages.subscribe(
      data => (this.configuredStages = data)
    );
    this.workflowMetadataService.update();
  }

  getWorkflow() {
    return this.workflowMetadata
      .filter(st => st.name !== "UNKNOWN")
      .filter(
        st =>
          (this.selectedWorkflow.has(STAGES_AND_CANDIDATES) &&
            (this.isValidStage(st) ||
              this.candidateForStages(st).length > 0)) ||
          this.selectedWorkflow.has(OTHERS)
      );
  }

  getCardFormat(status: WorkflowMetadata) {
    if (!this.isValidStage(status)) {
      return "border-info";
    }
    switch (status.stage) {
      case "dev": {
        return "text-white bg-secondary";
      }
      case "test": {
        return "bg-warning";
      }
      case "prod": {
        return "bg-success";
      }
      case "drop": {
        return "text-white bg-danger";
      }
      default: {
        return "border-info";
      }
    }
  }

  isValidStage(status: WorkflowMetadata) {
    return status.stage && this.configuredStages.indexOf(status.stage) >= 0;
  }

  candidateForStages(status: WorkflowMetadata) {
    return this.workflowMetadata.filter(
      st => this.isValidStage(st) && st.candidates === status.name
    );
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
    const stored = localStorage.getItem(
      "stored-workflow-status-editor-settings"
    );
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
