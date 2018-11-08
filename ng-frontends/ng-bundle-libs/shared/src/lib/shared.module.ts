import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectFilterComponent } from "./select-filter/select-filter.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SelectFilterComponent],
  exports: [SelectFilterComponent]
})
export class SharedModule { }
