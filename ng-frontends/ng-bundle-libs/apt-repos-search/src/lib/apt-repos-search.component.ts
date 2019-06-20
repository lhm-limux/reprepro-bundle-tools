import { Component, OnInit } from '@angular/core';
import { Suite, Content } from './Suite';

@Component({
  selector: 'lib-apt-repos-search',
  templateUrl: './apt-repos-search.component.html',
  styleUrls: ['./apt-repos-search.component.css']
})
export class AptReposSearchComponent implements OnInit {

  suites: Array<Suite>;

   constructor() {
    this.suites = []; 
    let suite = new Suite();
    let suite2 = new Suite();
    let content = new Content();
    let content2 = new Content();
    let content3 = new Content();
    let content4 = new Content();
    let content5 = new Content();

    suite.name = "Suite 1"
    suite2.name = "Suite 2"
    content.name = "Content 1"
    content2.name = "Content 2"
    content3.name = "Content 3"
    content4.name = "Content 4"
    content5.name = "Content 5"
    let contents1 = new Array<Content>();
    let contents2 = new Array<Content>();
    contents1.push(content)
    contents1.push(content2)
    contents1.push(content3)
    contents2.push(content4)
    contents2.push(content5)

    suite.content = contents1
    suite2.content = contents2

    
    this.suites.push(suite);
    this.suites.push(suite2);
   }

   

  ngOnInit() {
  }

}
