import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ServerLogComponent } from './server-log/server-log.component';
import { BundleListComponent } from './bundle-list/bundle-list.component';
import { SelectFilterComponent } from './select-filter/select-filter.component';

@NgModule({
  declarations: [
    AppComponent, ServerLogComponent, BundleListComponent, SelectFilterComponent
  ],
  imports: [
    BrowserModule, HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
