import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { APP_ROUTES } from "./app.routes";

import { AppComponent } from "./app.component";
import { HttpClientModule } from "@angular/common/http";
import { SharedModule } from "shared";
import { WorkflowStatusEditorComponent } from "./workflow-status-editor/workflow-status-editor.component";
import { ManagedBundleCardComponent } from './workflow-status-editor/managed-bundle-card/managed-bundle-card.component';
import { WorkflowStatusCardComponent } from './workflow-status-editor/workflow-status-card/workflow-status-card.component';

@NgModule({
  declarations: [AppComponent, WorkflowStatusEditorComponent, ManagedBundleCardComponent, WorkflowStatusCardComponent],
  imports: [BrowserModule, HttpClientModule, SharedModule, RouterModule.forRoot(APP_ROUTES)],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
