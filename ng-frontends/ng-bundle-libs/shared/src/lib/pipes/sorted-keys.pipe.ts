import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "sortedKeys"
})
export class SortedKeysPipe implements PipeTransform {
  transform(map: Map<string, any>, args?: any): any {
    return [...map.keys()].sort();
  }
}
