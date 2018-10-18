import { BundleListService } from './bundle-list.service';
import { ServerLogComponent } from './../server-log/server-log.component';
import { Component, OnInit } from '@angular/core';
import { Bundle } from '../shared/bundle';

@Component({
  selector: 'bundle-list',
  templateUrl: './bundle-list.component.html',
  styleUrls: ['./bundle-list.component.css']
})
export class BundleListComponent implements OnInit {
  bundles: Bundle[] = [];

  constructor(private bundleListService: BundleListService) { }

  ngOnInit() {
    this.update();
  }

  update() {
    this.bundleListService.getBundleList().subscribe(
      (bundles: Bundle[]) => {
        this.bundles = bundles;
      },
      errResp => {
        console.error('Error loading bundle list', errResp);
      }
    );
  }

}
