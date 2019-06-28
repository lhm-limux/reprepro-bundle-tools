import { BundleInfosService } from "./../bundle-infos.service";
import { Component, OnInit, Input } from "@angular/core";
import { BundleInfo } from "../bundle-infos.service";
import { RawSource } from "webpack-sources";

@Component({
  selector: "app-parent-bundle-tree",
  templateUrl: "./parent-bundle-tree.component.html",
  styleUrls: ["./parent-bundle-tree.component.css"]
})
export class ParentBundleTreeComponent implements OnInit {
  @Input()
  bundle: BundleInfo;

  constructor(private info: BundleInfosService) {}

  getParents(): { parent: string; isDirect: boolean; bundles: BundleInfo[] }[] {
    const directParents = this.bundle.parentTickets || [];
    const indirectParents = new Set<string>();
    this.addIndirectParentsForBundle(
      indirectParents,
      this.bundle,
      new Set(directParents)
    );
    const parents = directParents.map(p => ({
      parent: p,
      isDirect: true,
      bundles: this.info.parentToBundle.get(p) || []
    }));
    [...indirectParents]
      .filter(p => !directParents.includes(p))
      .sort()
      .forEach(p => {
        const bundles = this.info.parentToBundle.get(p) || [];
        parents.push({ parent: p, isDirect: false, bundles: bundles });
      });
    return parents;
  }

  private addIndirectParentsForBundle(
    res: Set<string>,
    bundle: BundleInfo,
    directParents: Set<string>
  ) {
    bundle.parentTickets.forEach(p => {
      if (!res.has(p)) {
        res.add(p);
        const bundles = this.info.parentToBundle.get(p) || [];
        bundles.forEach((b: BundleInfo) => {
          const otherParents = b.parentTickets || [];
          otherParents.forEach(op => res.add(op));
          this.addIndirectParentsForBundle(res, b, directParents);
        });
      }
    });
  }

  ngOnInit() {}
}
