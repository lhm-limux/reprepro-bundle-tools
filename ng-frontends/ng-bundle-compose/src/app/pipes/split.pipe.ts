import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "split"
})
export class SplitPipe implements PipeTransform {
  transform(
    value: any,
    sep: string = " ",
    slice1: number = null,
    slice2: number = null
  ): any {
    if (!slice1 && !slice2) {
      return value.split(sep);
    } else if (slice1 && !slice2) {
      return value.split(sep).slice(slice1);
    } else if (slice1 && slice2) {
      return value.split(sep).slice(slice1, slice2);
    }
    return "Invalid Use of SplitPipe";
  }
}
