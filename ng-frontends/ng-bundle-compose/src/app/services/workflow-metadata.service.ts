import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WorkflowMetadata, ConfigService } from "shared";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class WorkflowMetadataService {
  private workflowMetadata = new BehaviorSubject<WorkflowMetadata[]>([]);
  castWorkflowMetadata = this.workflowMetadata.asObservable();

  private configuredStages = new BehaviorSubject<string[]>([]);
  castConfiguredStages = this.configuredStages.asObservable();

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.http
      .get<WorkflowMetadata[]>(this.config.getApiUrl("workflowMetadata"))
      .subscribe(
        (workflowMetadata: WorkflowMetadata[]) => {
          this.workflowMetadata.next(workflowMetadata);
        },
        errResp => {
          console.error("Error loading workflow metadata", errResp);
        }
      );
    this.http
      .get<string[]>(this.config.getApiUrl("configuredStages"))
      .subscribe(
        (configuredStages: string[]) => {
          this.configuredStages.next(configuredStages);
        },
        errResp => {
          console.error("Error loading configured stages", errResp);
        }
      );
  }
}
