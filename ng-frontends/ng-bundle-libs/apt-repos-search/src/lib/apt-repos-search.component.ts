import { Component, OnInit, OnDestroy } from '@angular/core';
import { Suite } from './Suite';
import { Package } from './Package';
import { ConfigService } from "./config.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { AptReposSearchService } from './apt-repos-search.service'
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-apt-repos-search',
  templateUrl: './apt-repos-search.component.html',
  styleUrls: ['./apt-repos-search.component.css']
})
export class AptReposSearchComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  searchValue: String = "";

  activeSuites: Set<String> = new Set();
  suites: Suite[] = [];
  packages: Package[] = [];
  searchPackages: Package[] = [];
  

  constructor(private config: ConfigService, private http: HttpClient, public aptReposSearchService: AptReposSearchService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.aptReposSearchService.castDefaultSuites.subscribe(() => this.initDefaultSuitesAndPackages())
    );
    this.subscriptions.push(
      this.aptReposSearchService.castAllSuites.subscribe(() => this.initAllSuites())
    );
    this.subscriptions.push(
      this.aptReposSearchService.castPackages.subscribe(() => this.updatePackages())
    );

    this.aptReposSearchService.loadSuites(["default:"]);

    this.aptReposSearchService.loadSuites([":"]);
  }

  initDefaultSuitesAndPackages(){
    this.suites = this.aptReposSearchService.getSuites()
    this.suites.forEach(e => this.activeSuites.add(e.name))

    //this.aptReposSearchService.loadPackages(Array.from(this.activeSuites), ["."]);
  }

  initAllSuites(){
    this.suites = this.aptReposSearchService.getSuites()
  }

  updatePackages(){
    this.packages = this.aptReposSearchService.getPackages()
  }

  switchActiveSuite(name) {
    if (this.activeSuites.has(name)) {
      this.activeSuites.delete(name)
    } else {
      this.activeSuites.add(name)
      this.aptReposSearchService.loadPackages(Array.from(this.activeSuites), [((this.searchValue=="") ? "." : this.searchValue)])
    }
  }

  checkActiveSuites(name) {
    if (this.activeSuites.has(name)) {
      return true;
    } else {
      return false;
    }
  }

  onEnter(value: String) {
    let values = value.split(" ");
    this.aptReposSearchService.loadPackages(Array.from(this.activeSuites), values)
  }

  onChange(value: string) {
    if(value.length !== 0){
      let values = value.split(" ");
      let sPack = new Set();
      for (let v of values) {
        if(v != "") {
          //sPack.add(this.packages.filter(p => p.name.includes(v) === true))
          this.packages.filter(p => p.name.includes(v) === true).forEach(p => sPack.add(p));
        }
      }
      this.searchPackages = Array.from(sPack);
      //console.log(Array.from(sPack))
      console.log(this.searchPackages)
      console.log(this.suites)
    } else {
      this.searchPackages = [];
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
