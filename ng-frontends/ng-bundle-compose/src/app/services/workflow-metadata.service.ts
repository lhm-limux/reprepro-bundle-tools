/***********************************************************************
* Copyright (c) 2018 Landeshauptstadt München
*           (c) 2018 Christoph Lutz (InterFace AG)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the European Union Public Licence (EUPL),
* version 1.1 (or any later version).
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* European Union Public Licence for more details.
*
* You should have received a copy of the European Union Public Licence
* along with this program. If not, see
* https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
***********************************************************************/

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WorkflowMetadata, ConfigService, TargetDescription } from "shared";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class WorkflowMetadataService {
  private _workflowMetadata = new BehaviorSubject<WorkflowMetadata[]>([]);
  workflowMetadata = this._workflowMetadata.asObservable();

  private _configuredStages = new BehaviorSubject<string[]>([]);
  configuredStages = this._configuredStages.asObservable();

  private _configuredTargets = new BehaviorSubject<TargetDescription[]>([]);
  configuredTargets = this._configuredTargets.asObservable();

  constructor(private config: ConfigService, private http: HttpClient) {}

  update(): void {
    this.updateWorkflowMetadata();
    this.updateConfiguredStages();
    this.updateConfiguredTargets();
  }

  updateWorkflowMetadata(): void {
    this.http
      .get<WorkflowMetadata[]>(this.config.getApiUrl("workflowMetadata"))
      .subscribe(
        (data: WorkflowMetadata[]) => {
          this._workflowMetadata.next(data);
        },
        errResp => {
          console.error("Error loading workflow metadata", errResp);
        }
      );
  }

  updateConfiguredStages(): void {
    this.http
      .get<string[]>(this.config.getApiUrl("configuredStages"))
      .subscribe(
        (data: string[]) => {
          this._configuredStages.next(data);
        },
        errResp => {
          console.error("Error loading configured stages", errResp);
        }
      );
  }

  updateConfiguredTargets(): void {
    this.http
      .get<TargetDescription[]>(this.config.getApiUrl("configuredTargets"))
      .subscribe(
        (data: TargetDescription[]) => {
          this._configuredTargets.next(data);
        },
        errResp => {
          console.error("Error loading configured targets", errResp);
        }
      );
  }
}
