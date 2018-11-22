import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectFilterComponent } from "./select-filter/select-filter.component";
import { UnpublishedChangesComponent } from './unpublished-changes/unpublished-changes.component';
import { FontawsomeToggleButtonComponent } from './fontawsome-toggle-button/fontawsome-toggle-button.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SelectFilterComponent, UnpublishedChangesComponent, FontawsomeToggleButtonComponent],
  exports: [SelectFilterComponent, UnpublishedChangesComponent, FontawsomeToggleButtonComponent]
})
export class SharedModule { }
