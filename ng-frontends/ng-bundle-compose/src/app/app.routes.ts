import { WorkflowStatusEditorComponent } from "./workflow-status-editor/workflow-status-editor.component";
import { Routes } from "@angular/router";

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
  /*{
    path: "bundle/:dist/:id",
    component: BundleEditComponent
  },*/
  {
    path: "**",
    redirectTo: "workflow-status-editor"
  }
];
