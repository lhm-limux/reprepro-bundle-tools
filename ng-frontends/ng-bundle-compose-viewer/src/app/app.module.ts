import { HttpClientModule } from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";
import { SharedModule } from "shared";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { BundleInfoCardComponent } from "./bundle-info-card/bundle-info-card.component";

@NgModule({
  declarations: [AppComponent, BundleInfoCardComponent],
  imports: [BrowserModule, HttpClientModule, SharedModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
