import { Component, OnInit, OnDestroy } from '@angular/core';
import { Suite } from './Suite';
import { Package } from './Package';
import { ConfigService } from "./config.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { AptReposSearchService } from './apt-repos-search.service'
import { Subscription } from 'rxjs';
import { MessagesService } from 'shared';

@Component({
  selector: 'lib-apt-repos-search',
  templateUrl: './apt-repos-search.component.html',
  styleUrls: ['./apt-repos-search.component.css']
})
export class AptReposSearchComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  searchValue: String = "";
  searchValues: string[] = [];
  searchValuesSuites: string[] = [];

  activeSuites: Set<String> = new Set();
  activeTags: Set<String> = new Set();
  suites: Suite[] = [];
  tags: String[] = [];
  packages: Package[] = [];
  searchPackages: Package[] = [];

  page = 1;
  pageSize = 500;
  amountPages = 0;

  constructor(private config: ConfigService, private http: HttpClient, private aptReposSearchService: AptReposSearchService, private messages: MessagesService) { }

  ngOnInit() {
    this.messages.clear();
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

  initDefaultSuitesAndPackages() {
    this.suites = this.aptReposSearchService.getSuites()
    this.suites.forEach(e => this.activeSuites.add(e.name))

    this.aptReposSearchService.loadPackages(Array.from(this.activeSuites), ["."]);
  }

  initAllSuites() {
    this.suites = this.aptReposSearchService.getSuites()
    var allTags: Set<String> = new Set();
    for (let suite of this.suites){
      for(let tag of suite.tags){
        allTags.add(tag)
      }
    }
    this.tags = Array.from(allTags)
  }

  updatePackages() {
    this.packages = this.aptReposSearchService.getPackages()
  }

  switchActiveTag(tag) {
    if (this.activeTags.has(tag)) {
      this.activeTags.delete(tag)
    } else {
      this.activeTags.add(tag)
    }
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
    this.searchValuesSuites = value.split(" ");
  }

  onChangeSuites(value: string) {
    this.searchValuesSuites = value.split(" ");
  }

  unselectAllSuites() {
    this.activeSuites.clear();
    this.packages = [];
  }

  filteredSuites() {
    var taggedSuites = this.suites.filter(s => {
      for(let suiteTag of s.tags) {
        if (this.activeTags.has(suiteTag)) {
          return true
        }
      }
    })
    if (taggedSuites.length === 0){
      return this.suites
    }
    if (this.searchValuesSuites.length === 0) {
      return taggedSuites
    } else {
      return taggedSuites.filter(s => {
        for (let v of this.searchValuesSuites){
          if (s.name.includes(v) === true) return true; else return false;
        }
      })
    }
  }

  filteredPackages() {
    var activePackages = this.packages.filter(p => {
      return this.activeSuites.has(p.suite)
    })
    if (this.searchValues.length === 0) {
      return activePackages
    } else {
      return activePackages.filter(p => {
        var flag = false;
        for (let v of this.searchValues)
        {
          if (v.substring(0, 4) === "src:") {
            if (p.sourcePackageName.includes(v.substring(4)) === true) flag = true; else return false;
          } else {
            if (p.name.includes(v) === true) flag = true; else return false;
          }
        }
        if (flag) return true; else return false;
      });
    }
  }

  sortedTags(): String[] {
    return this.tags.sort((a: String, b: String) => {
      const replPattern = /([^a-zA-Z]+|\s+)/g;
      const partsA = a.replace(replPattern, " ").split(" ");
      const partsB = b.replace(replPattern, " ").split(" ");
      console.log(partsA);
      if(partsA.length < partsB.length) {
        return -1;
      }
      if(partsA.length > partsB.length) {
        return 1;
      }
      return a.toString().localeCompare(b.toString());
    });
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
