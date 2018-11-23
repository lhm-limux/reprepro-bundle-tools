import { WorkflowStatusEditorComponent } from "./workflow-status-editor/workflow-status-editor.component";
import { Routes } from "@angular/router";
import { ManagedBundleEditorComponent } from "./managed-bundle-editor/managed-bundle-editor.component";

export const APP_ROUTES: Routes = [
  {
    path: "",
    redirectTo: "workflow-status-editor",
    pathMatch: "full"
  },
  {
    path: "workflow-status-editor",
    component: WorkflowStatusEditorComponent
  },
  {
    path: "managed-bundle/:dist/:id",
    component: ManagedBundleEditorComponent
  },
  {
    path: "**",
    redirectTo: "workflow-status-editor"
  }
];
