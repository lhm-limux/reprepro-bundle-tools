import { Component, OnInit } from '@angular/core';
import { Suite } from './Suite';
import { Package } from './Package';
import { ConfigService } from "./config.service";
import { HttpClient, HttpParams } from "@angular/common/http";

@Component({
  selector: 'lib-apt-repos-search',
  templateUrl: './apt-repos-search.component.html',
  styleUrls: ['./apt-repos-search.component.css']
})
export class AptReposSearchComponent implements OnInit {

  activeSuites: String[];
  suites: Suite[] = [];
  packages: Package[] = [];
  searchValue: String = '';
  
  constructor(private config: ConfigService, private http: HttpClient) { }
  
  ngOnInit() {
    let params = new HttpParams()
      .set("suiteTag", JSON.stringify(":"))

    this.http
    .get<Suite[]>(this.config.getApiUrl("getSuites"), {
      params: params
    })
      .subscribe(
        (data: Suite[]) => {
          const last = this.suites;
          this.suites = data;
          this.activeSuites = new Array(this.suites.length);
          //console.log(this.suites);
        },
        errResp => {
          console.error("Error loading suites list", errResp);
        }
      );

      params = new HttpParams()
      .set("suiteTag", JSON.stringify("default:"))

    this.http
    .get<Suite[]>(this.config.getApiUrl("getSuites"), {
      params: params
    })
      .subscribe(
        (data: Suite[]) => {
          const last = this.suites;
          data.forEach(element => {
            this.activeSuites.push(element.name)
          });
          //console.log(this.suites);
        },
        errResp => {
          console.error("Error loading suites list", errResp);
        }
      );

      /*this.http
      .get<Package[]>(this.config.getApiUrl("getDefaultPackages"))
      .subscribe(
        (data: Package[]) => {
          this.packages = data;
          console.log(this.packages);
        },
        errResp => {
          console.error("Error loading packages list", errResp);
        }
      );*/
  }

  display(name) {
    if(this.activeSuites.indexOf(name) !== -1){
      let index = this.activeSuites.indexOf(name)
      this.activeSuites.splice(index, 1)
    } else {
      this.activeSuites.push(name)
    }
  }

  checkActiveSuites(name) {
    if(this.activeSuites.indexOf(name) !== -1){
      return true;
    } else {
      return false;
    }
  }

  onEnter(value: String) {
    this.searchValue = value;

    this.http
      .get<Package[]>(this.config.getApiUrl("getCustomPackages/" + this.searchValue))
      .subscribe(
        (data: Package[]) => {
          this.packages = data;
          console.log(this.packages);
        },
        errResp => {
          console.error("Error loading packages list", errResp);
        }
      );
  }
}
