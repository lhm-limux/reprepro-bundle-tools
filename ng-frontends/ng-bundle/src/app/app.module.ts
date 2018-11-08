import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AppComponent } from "./app.component";
import { APP_ROUTES } from "./app.routes";
import { SharedModule } from "shared";
import { ServerLogComponent } from "./server-log/server-log.component";
import { BundleListComponent } from "./bundle-list/bundle-list.component";
import { BundleEditComponent } from "./bundle-edit/bundle-edit.component";
import { MockBundleListService } from "./test/mock-bundle-list-service.class";
import { BundleListService } from "./bundle-list/bundle-list.service";

@NgModule({
  declarations: [
    AppComponent,
    ServerLogComponent,
    BundleListComponent,
    BundleEditComponent
  ],
  imports: [BrowserModule, HttpClientModule, SharedModule, RouterModule.forRoot(APP_ROUTES)],
  bootstrap: [AppComponent],
  //providers: [{ provide: BundleListService, useClass: MockBundleListService }],
})
export class AppModule {}
