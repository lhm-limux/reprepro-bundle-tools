import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AppComponent } from "./app.component";
import { APP_ROUTES } from "./app.routes";
import { ServerLogComponent } from "./server-log/server-log.component";
import { BundleListComponent } from "./bundle-list/bundle-list.component";
import { SelectFilterComponent } from "./select-filter/select-filter.component";
import { BundleEditComponent } from "./bundle-edit/bundle-edit.component";
import { MockBundleListService } from "./test/mock-bundle-list-service.class";
import { BundleListService } from "./bundle-list/bundle-list.service";

export function windowFactory() {
  console.log("my windowFactory called with: " + window);
  return window;
}

@NgModule({
  declarations: [
    AppComponent,
    ServerLogComponent,
    BundleListComponent,
    SelectFilterComponent,
    BundleEditComponent
  ],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(APP_ROUTES)],
  bootstrap: [AppComponent],
  providers: [{ provide: "windowObject", useFactory: windowFactory }]
  //providers: [{ provide: BundleListService, useClass: MockBundleListService }],
})
export class AppModule {}
