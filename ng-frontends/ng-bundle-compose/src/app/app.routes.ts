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

import { WorkflowStatusEditorComponent } from "./workflow-status-editor/workflow-status-editor.component";
import { Routes } from "@angular/router";
import { ManagedBundleEditorComponent } from "./managed-bundle-editor/managed-bundle-editor.component";
import { LoginPageComponent } from "./login-page/login-page.component";

export const APP_ROUTES: Routes = [
  {
    path: "",
    redirectTo: "/login-page?autologin=true",
    pathMatch: "full"
  },
  {
    path: "login-page",
    component: LoginPageComponent
  },
  {
    path: "workflow-status-editor",
    component: WorkflowStatusEditorComponent
  },
  {
    path: "managed-bundle/:dist/:id",
    component: ManagedBundleEditorComponent
  },
  {
    path: "**",
    redirectTo: "login-page"
  }
];
