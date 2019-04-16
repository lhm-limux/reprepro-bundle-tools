/***********************************************************************
 * Copyright (c) 2019 Landeshauptstadt München
 *           (c) 2019 Christoph Lutz (InterFace AG)
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

export function parseBundleId(bid: string): { dist: string; num: string } {
  const parts = bid.split(":");
  if (parts.length === 2 && parts[0] === "bundle") {
    const p2 = parts[1].split("/");
    if (p2.length === 2 && Number.parseInt(p2[1], 10)) {
      return { dist: p2[0], num: p2[1] };
    }
  }
  return undefined;
}
