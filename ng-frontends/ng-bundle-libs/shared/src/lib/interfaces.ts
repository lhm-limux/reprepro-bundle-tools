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
