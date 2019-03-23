import { HttpClientModule } from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { BundleInfoCardComponent } from "./bundle-info-card/bundle-info-card.component";
import { SelectFilterComponent } from './select-filter/select-filter.component';

@NgModule({
  declarations: [AppComponent, BundleInfoCardComponent, SelectFilterComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
