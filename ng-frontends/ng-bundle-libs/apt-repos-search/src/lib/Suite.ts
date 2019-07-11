import { Component, OnInit } from '@angular/core';

export class Suite {
  name: string;
  tags: string[];
  architectures: string[];
  components: string[];
  aptSuite: string;
  distsUrl: string;
  repoUrl: string;
  hasSources: boolean;
  trustedGPG: string;
  aptConf: string;
  sourcesList: string;
}