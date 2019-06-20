import { Component, OnInit } from '@angular/core';

export class Suite {
  name: string;
  content: Content[];
  isActive: boolean;

  constructor(){
    this.isActive = true;
  }

  activate() {
    if(this.isActive == false){
      this.isActive = true;
    } else {
      this.isActive = false;
    }
  }
}

export class Content {
  name: string;
  isActive: boolean;

  constructor(){
    this.isActive = false;
  }

  activate() {
    if(this.isActive == false){
      this.isActive = true;
    } else {
      this.isActive = false;
    }
  }
}