import { Injectable } from '@angular/core';
import { ConfigService } from "./config.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Suite } from './Suite';
import { Package } from './Package';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AptReposSearchService {

  constructor(private config: ConfigService, private http: HttpClient) { }
  private changedAllSuites = new Subject();
  castDefaultSuites = this.changedAllSuites.asObservable();
  private changedDefaultSuites = new Subject();
  castAllSuites = this.changedDefaultSuites.asObservable();
  private changedPackages = new Subject();
  castPackages = this.changedPackages.asObservable();
  isInitialized: boolean = false;

  suites: Suite[] = [];
  packages: Package[] = [];

  loadSuites(value: String[]): void {
    let params = new HttpParams()
      .set("suiteTag", JSON.stringify(value))

    this.http
      .get<Suite[]>(this.config.getApiUrl("getSuites"), {
        params: params
      })
      .subscribe(
        (data: Suite[]) => {
          const last = this.suites;
          this.suites = data;

          if(value.indexOf("default:") > -1){
            this.changedDefaultSuites.next();
          } else {
            this.changedAllSuites.next();
          }
          //console.log(this.suites);
        },
        errResp => {
          console.error("Error loading suites list", errResp);
        }
      );
      
    
  }

  loadPackages(activeSuites:String[], value: String[]): void {
    let params = new HttpParams()
      .set("suiteTag", JSON.stringify(activeSuites))
      .set("searchString", JSON.stringify(value))

    this.http
      .get<Package[]>(this.config.getApiUrl("getCustomPackages"), {
        params: params
      })
      .subscribe(
        (data: Package[]) => {
          const last = this.packages;
          this.packages = data;
          console.log(this.packages);

          this.changedPackages.next();
        },
        errResp => {
          console.error("Error loading packages list", errResp);
        }
      );

      
  }

  getSuites(): Suite[]{
    return this.suites;
  }

  getPackages(): Package[]{
    return this.packages;
  }

}
