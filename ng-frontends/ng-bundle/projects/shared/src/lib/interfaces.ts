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
