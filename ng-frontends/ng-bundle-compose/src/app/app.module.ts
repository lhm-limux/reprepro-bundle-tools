import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { APP_ROUTES } from "./app.routes";

import { AppComponent } from "./app.component";
import { HttpClientModule } from "@angular/common/http";
import { WorkflowStatusEditorComponent } from "./workflow-status-editor/workflow-status-editor.component";

@NgModule({
  declarations: [AppComponent, WorkflowStatusEditorComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(APP_ROUTES)],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
