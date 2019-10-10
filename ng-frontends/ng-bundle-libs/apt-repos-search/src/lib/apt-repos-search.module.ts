import { NgModule } from '@angular/core';
import { AptReposSearchComponent } from './apt-repos-search.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'

import {MatCheckboxModule} from '@angular/material/checkbox';

@NgModule({
  imports: [
    CommonModule,
    MatCheckboxModule,
    FormsModule
  ],
  declarations: [AptReposSearchComponent],
  exports: [AptReposSearchComponent]
})
export class AptReposSearchModule { }
