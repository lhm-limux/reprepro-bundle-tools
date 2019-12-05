import { NgModule } from '@angular/core';
import { AptReposSearchComponent } from './apt-repos-search.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [AptReposSearchComponent],
  exports: [AptReposSearchComponent]
})
export class AptReposSearchModule { }
