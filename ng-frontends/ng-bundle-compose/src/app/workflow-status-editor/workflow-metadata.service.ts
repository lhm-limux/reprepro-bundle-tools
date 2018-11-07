import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WorkflowMetadata, ConfigService } from "shared";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class WorkflowMetadataService {
  private workflowMetadata = new BehaviorSubject<WorkflowMetadata[]>([]);
  cast = this.workflowMetadata.asObservable();

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.http.get<WorkflowMetadata[]>(this.config.getApiUrl("workflowMetadata")).subscribe(
      (workflowMetadata: WorkflowMetadata[]) => {
        this.workflowMetadata.next(workflowMetadata);
      },
      errResp => {
        console.error("Error loading workflow metadata", errResp);
      }
    );
  }
}
