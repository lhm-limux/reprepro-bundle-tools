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

    // CL --> TODO: diese Logik sollte in den apt-repos-search.service rein, nicht in die component
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

      params = new HttpParams()
      .set("suiteTag", JSON.stringify("default:")) // CL --> TODO: sollte activeSuites sein und mit nach jeder Änderung der activeSuites erneut aufgerufen werden.
      .set("searchString", JSON.stringify("git")) //TODO: should eventually search for all packages not only git ones

      this.http
      .get<Package[]>(this.config.getApiUrl("getCustomPackages"), {
        params: params
      })
      .subscribe(
        (data: Package[]) => {
          this.packages = data;
        },
        errResp => {
          console.error("Error loading packages list", errResp);
        }
      );
  }

  display(name) {
    // CL --> vielleicht wäre das mit einem Set anstatt einer Liste performanter und einfacher zu lesen.
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
    let params = new HttpParams()
      .set("suiteTag", JSON.stringify(":")) // CL --> hier sollte es auch nur activeSuites sein statt ":"
      .set("searchString", JSON.stringify(value))

    this.http
      .get<Package[]>(this.config.getApiUrl("getCustomPackages"), {
        params: params
      })
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
