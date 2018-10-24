import { Routes } from "@angular/router";
import { BundleListComponent } from "./bundle-list/bundle-list.component";
import { BundleEditComponent } from "./bundle-edit/bundle-edit.component";

export const APP_ROUTES: Routes = [
  {
    path: "",
    redirectTo: "bundle-list",
    pathMatch: "full"
  },
  {
    path: "bundle-list",
    component: BundleListComponent,
  },
  {
    path: "bundle/:dist/:id",
    component: BundleEditComponent
  },
  {
    path: "**",
    redirectTo: "bundle-list"
  }
];
