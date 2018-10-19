import { Injectable } from '@angular/core';
import { Observer, Observable } from 'rxjs';
import { Bundle } from '../shared/bundle';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BundleListService {
  observer: Observer<Bundle[]>;

  constructor(private http: HttpClient) { }

  getBundleList(): Observable<Bundle[]> {
    return this.http.get<Bundle[]>("/bundleList");
  }
}
