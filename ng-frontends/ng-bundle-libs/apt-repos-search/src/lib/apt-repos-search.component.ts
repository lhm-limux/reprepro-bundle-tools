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
  searchValues: string[] = [];

  activeSuites: Set<String> = new Set();
  suites: Suite[] = [];
  packages: Package[] = [];
  searchPackages: Package[] = [];

  page = 1;
  pageSize = 500;
  amountPages = 0;

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
  }

  ngAfterViewInit() {
    this.aptReposSearchService.loadSuites([":"]);
  }

  initDefaultSuitesAndPackages() {
    this.suites = this.aptReposSearchService.getSuites()
    this.suites.forEach(e => this.activeSuites.add(e.name))

    //this.aptReposSearchService.loadPackages(Array.from(this.activeSuites), ["."]);
  }

  initAllSuites() {
    this.suites = this.aptReposSearchService.getSuites()
  }

  updatePackages() {
    this.packages = this.aptReposSearchService.getPackages()
  }

  switchActiveSuite(name) {
    if (this.activeSuites.has(name)) {
      this.activeSuites.delete(name)
    } else {
      this.activeSuites.add(name)
      this.aptReposSearchService.loadPackages(Array.from(this.activeSuites), [((this.searchValue == "") ? "." : this.searchValue)])
    }
    this.updateAmountPages()
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
    this.searchValues = value.split(" ");
  }

  unselectAllSuites() {
    this.activeSuites.clear();
  }

  filteredPackages() {
    if (this.searchValues.length === 0) {
      return this.packages
    } else {
      return this.packages.filter(p => { for (let v of this.searchValues) { if (p.name.includes(v) === true) return true; } return false; });
    }
  }

  generatePages() {
    this.updateAmountPages()
    let allPages: any = [...Array(this.amountPages+1).keys()].slice(1)
    if(allPages.length > 5){
      if(this.page === 1){
        allPages = allPages.slice(this.page-1, this.page+4)
        allPages.push("...")
      }else if(this.page === 2){
        allPages = allPages.slice(this.page-2, this.page+3)
        allPages.push("...")
      }else if(this.page === allPages.length){
        allPages = allPages.slice(this.page-5, this.page)
        allPages.unshift("...")
      }else if(this.page === allPages.length-1){
        allPages = allPages.slice(this.page-4, this.page+1)
        allPages.unshift("...")
      }else{
        allPages = allPages.slice(this.page-3, this.page+2)
        if(this.page !== 3){
          allPages.unshift("...")
        }
        if(this.page !== this.amountPages-2){
          allPages.push("...")
        }
      }
    }
    return allPages
  }

  updateAmountPages() {
    this.amountPages = 1+Math.floor(this.filteredPackages().length/this.pageSize)
    if(this.page > this.amountPages){
      this.page = this.amountPages;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
