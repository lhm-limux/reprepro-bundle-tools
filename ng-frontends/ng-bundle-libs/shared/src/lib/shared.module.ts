import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectFilterComponent } from "./select-filter/select-filter.component";
import { UnpublishedChangesComponent } from './unpublished-changes/unpublished-changes.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SelectFilterComponent, UnpublishedChangesComponent],
  exports: [SelectFilterComponent, UnpublishedChangesComponent]
})
export class SharedModule { }
