/***********************************************************************
* Copyright (c) 2018 Landeshauptstadt München
*           (c) 2018 Christoph Lutz (InterFace AG)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the European Union Public Licence (EUPL),
* version 1.1 (or any later version).
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* European Union Public Licence for more details.
*
* You should have received a copy of the European Union Public Licence
* along with this program. If not, see
* https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
***********************************************************************/

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
