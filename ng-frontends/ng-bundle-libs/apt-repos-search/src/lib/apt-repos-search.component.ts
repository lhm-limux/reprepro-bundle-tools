import { Component, OnInit } from '@angular/core';
import { Suite } from './Suite';
import { ConfigService } from "./config.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'lib-apt-repos-search',
  templateUrl: './apt-repos-search.component.html',
  styleUrls: ['./apt-repos-search.component.css']
})
export class AptReposSearchComponent implements OnInit {

  activeSuites: Boolean[];
  suites: Suite[] = [];

   constructor(private config: ConfigService, private http: HttpClient) { }

   ngOnInit() {
    this.http
      .get<Suite[]>(this.config.getApiUrl("getAllSuites"))
      .subscribe(
        (data: Suite[]) => {
          const last = this.suites;
          this.suites = data;
          this.activeSuites = new Array(this.suites.length);
          for (let activeSuite of this.activeSuites) {
              activeSuite = false;
          }
        },
        errResp => {
          console.error("Error loading suites list", errResp);
        }
      );
  }

  display(i) {
    if(this.activeSuites[i] == false){
      this.activeSuites[i] = true;
    } else {
      this.activeSuites[i] = false;
    }
  }

}
