import { NgModule } from '@angular/core';
import { AptReposSearchComponent } from './apt-repos-search.component';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [AptReposSearchComponent],
  exports: [AptReposSearchComponent]
})
export class AptReposSearchModule { }
