import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { BrowserModule } from "@angular/platform-browser";
import { SharedModule } from "shared";
import { NgModule } from "@angular/core";

import { APP_ROUTES } from "./app.routes";
import { AppComponent } from "./app.component";
import { BundleInfoCardComponent } from "./bundle-info-card/bundle-info-card.component";
import { BundleSearchComponent } from './bundle-search/bundle-search.component';
import { ParentBundleTreeComponent } from './parent-bundle-tree/parent-bundle-tree.component';
import { LiBundleInfoRefComponent } from './li-bundle-info-ref/li-bundle-info-ref.component';

@NgModule({
  declarations: [AppComponent, BundleInfoCardComponent, BundleSearchComponent, ParentBundleTreeComponent, LiBundleInfoRefComponent],
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
