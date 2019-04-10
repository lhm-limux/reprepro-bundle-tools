import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { BrowserModule } from "@angular/platform-browser";
import { SharedModule } from "shared";
import { NgModule } from "@angular/core";

import { APP_ROUTES } from "./app.routes";
import { AppComponent } from "./app.component";
import { BundleInfoCardComponent } from "./bundle-info-card/bundle-info-card.component";
import { BundleSearchComponent } from './bundle-search/bundle-search.component';

@NgModule({
  declarations: [AppComponent, BundleInfoCardComponent, BundleSearchComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forRoot(APP_ROUTES)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
