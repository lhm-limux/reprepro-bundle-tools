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

export interface Bundle {
  name: string;
  distribution: string;
  target: string;
  subject: string;
  readonly: boolean;
  creator: string;
}

export interface BundleMetadata {
  bundle: Bundle;
  releasenotes: string;
  basedOn: string;
}

export interface ManagedBundle {
  id: string,
  distribution: string;
  status: WorkflowMetadata;
  target: string;
  ticket: string;
  ticketUrl: string;
}

export interface ManagedBundleInfo {
  managedBundle: ManagedBundle;
  basedOn: string;
  subject: string;
  creator: string;
}

export interface WorkflowMetadata {
  ord: number,
  name: string,
  comment: string,
  repoSuiteTag: string,
  tracStatus: string,
  tracResolution: string,
  stage: string,
  override: boolean,
  candidates: string
}

export interface BackendLogEntry {
  logger: string,
  level: string,
  message: string
}

export interface VersionedChange {
  id: string,
  author: string,
  message: string,
  date: number,
  published: boolean
}

export interface TargetDescription {
  value: string,
  description: string
}

export interface AuthType {
  authId: string,
  requiredFor: string
}

export interface AuthRef {
  authId: string,
  user: string,
  storageSlotId: string, // comes from the server
  key: string, // empty unless we got storageSlotId
}

export interface AuthRequired {
  actionId: string,
  refs: AuthRef[]
}
