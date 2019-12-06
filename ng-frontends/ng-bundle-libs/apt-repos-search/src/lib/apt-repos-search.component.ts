import { Component, OnInit, OnDestroy } from '@angular/core';
import { Suite } from './Suite';
import { Package } from './Package';
import { ConfigService } from "./config.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { AptReposSearchService } from './apt-repos-search.service'
import { MessagesService } from 'shared';
import { Subscription, BehaviorSubject } from 'rxjs';
import { delay, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'lib-apt-repos-search',
  templateUrl: './apt-repos-search.component.html',
  styleUrls: ['./apt-repos-search.component.css']
})
export class AptReposSearchComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  private searchStringPackages = new BehaviorSubject<String>("");
  private searchStringSuites = new BehaviorSubject<String>("");
  private packages: Package[] = [];
  private suites: Suite[] = [];
  private tags: String[] = [];

  filteredPackages: Package[];
  filteredSuites: Suite[];
  activeSuites: Set<String> = new Set();
  activeTags: Set<String> = new Set();

  page = 1;
  pageSize = 500;
  amountPages = 0;

  constructor(private config: ConfigService, private http: HttpClient, private aptReposSearchService: AptReposSearchService, private messages: MessagesService) {
    this.searchStringPackages.asObservable().pipe(debounceTime(400)).subscribe((s: String) => {
      this.filteredPackages = this.filterPackages();
    });
    this.searchStringSuites.asObservable().pipe(debounceTime(400)).subscribe((s: String) => {
      this.filteredSuites = this.filterSuites();
    });
    this.activeTags.add("default");
   }

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
    this.filteredPackages = this.filterPackages();
  }

  switchActiveTag(tag) {
    if (this.activeTags.has(tag)) {
      this.activeTags.delete(tag)
    } else {
      this.activeTags.add(tag)
    }
    this.filteredSuites = this.filterSuites();
  }

  switchActiveSuite(name) {
    if (this.activeSuites.has(name)) {
      this.activeSuites.delete(name)
    } else {
      this.activeSuites.add(name)
    }
    this.updateAmountPages()
  }

  getActiveSuites() {
    return Array.from(this.activeSuites)
  }

  isActiveSuite(name) {
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
    this.searchStringPackages.next(value);
  }

  onChangeSuites(value: string) {
    this.searchStringSuites.next(value);
  }

  unselectAllSuites() {
    this.activeSuites.clear();
    this.packages = [];
  }

  private filterSuites() {
    const search = this.searchStringSuites.value.split(" ");
    var taggedSuites = this.suites.filter(s => {
      for(let suiteTag of s.tags) {
        if (this.activeTags.has(suiteTag)) {
          return true
        }
      }
    })
    if (taggedSuites.length === 0){
      taggedSuites = this.suites
    }
    if (search.length === 0) {
      return taggedSuites
    } else {
      return taggedSuites.filter(s => {
        for (let v of search){
          if (s.name.includes(v) === true) return true; else return false;
        }
      })
    }
  }

  private filterPackages(): Package[] {
    const search = this.searchStringPackages.value.split(" ");
    var activePackages = this.packages.filter(p => {
      return this.activeSuites.has(p.suite)
    })
    if (search.length === 0) {
      return activePackages
    } else {
      return activePackages.filter(p => {
        var flag = false;
        for (let v of search)
        {
          if (v.substring(0, 4) === "src:") {
            if (p.sourcePackageName.startsWith(v.substring(4)) === true) flag = true; else return false;
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
    this.amountPages = 1+Math.floor(this.filteredPackages.length/this.pageSize)
    if(this.page > this.amountPages){
      this.page = this.amountPages;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
