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

import { Bundle } from "shared";
import { BehaviorSubject } from "rxjs";

export class MockBundleListService {
  private bundles = new BehaviorSubject<Bundle[]>([]);
  cast = this.bundles.asObservable();

  update(): void {
    const bundles: Bundle[] = [];
    for (let i = 1; i <= 10; ++i) {
      bundles.push({
        name: "mybionic/" + ("0000" + i).slice(-4),
        distribution: "mybionic",
        target: "plus",
        subject: "This is a bundle",
        readonly: false,
        creator: "chlu"
      });
      bundles.push({
        name: "mytrusty/" + ("0000" + i).slice(-4),
        distribution: "mytrusty",
        target: "plus",
        subject: "This is a bundle",
        readonly: true,
        creator: "some.other"
      });
    }
    this.bundles.next(bundles);
  }

  getAvailableDistributions(): Set<string> {
    return new Set(["mybionic", "mytrusty"]);
  }

  getAvailableTargets(): Set<string> {
    return new Set(["plus", "unattended"]);
  }

  getUserOrOthers(user: string, bundle: Bundle): string {
    return bundle.creator === user ? user : "Others";
  }

  getAvailableUserOrOthers(user: string): Set<string> {
    return new Set(["chlu", "Others"]);
  }

  getAvailableReadonly(): Set<boolean> {
    return new Set([true, false]);
  }
}
