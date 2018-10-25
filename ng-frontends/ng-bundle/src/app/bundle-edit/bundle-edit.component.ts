import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-bundle-edit",
  templateUrl: "./bundle-edit.component.html",
  styleUrls: ["./bundle-edit.component.css"]
})
export class BundleEditComponent implements OnInit {
  id: string;
  distribution: string;
  subject: string;
  basedOn: string;
  target: string;
  creator: string;

  @ViewChild("targetSelect")
  targetSelect;

  constructor(private route: ActivatedRoute) {
    route.params.subscribe(p => {
      this.id = p["id"];
      this.distribution = p["dist"];
    });
  }

  ngOnInit() {}

  selectTarget($event): void {
    const sel = this.targetSelect.nativeElement;
    this.target = sel.options[sel.selectedIndex].value;
    //console.log("Target: " + this.target);
  }
}
