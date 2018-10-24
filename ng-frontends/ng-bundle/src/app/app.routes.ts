import { Routes } from "@angular/router";
import { BundleListComponent } from "./bundle-list/bundle-list.component";
import { BundleEditComponent } from "./bundle-edit/bundle-edit.component";

export const APP_ROUTES: Routes = [
  {
    path: "",
    component: BundleListComponent,
    pathMatch: "full"
  },
  {
    path: "view/:id",
    component: BundleEditComponent
  },
  {
    path: "**",
    redirectTo: "/index.html"
  }
];
