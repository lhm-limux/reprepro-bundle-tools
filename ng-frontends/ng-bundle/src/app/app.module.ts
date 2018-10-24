import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { ServerLogComponent } from "./server-log/server-log.component";
import { BundleListComponent } from "./bundle-list/bundle-list.component";
import { SelectFilterComponent } from "./select-filter/select-filter.component";
import { MockBundleListService } from "./test/mock-bundle-list-service.class";
import { BundleListService } from "./bundle-list/bundle-list.service";

@NgModule({
  declarations: [
    AppComponent,
    ServerLogComponent,
    BundleListComponent,
    SelectFilterComponent
  ],
  imports: [BrowserModule, HttpClientModule],
  //providers: [{ provide: BundleListService, useClass: MockBundleListService }],
  bootstrap: [AppComponent]
})
export class AppModule {}
