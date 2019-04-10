import { BackendLogEntry } from "./interfaces";
import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject, of } from "rxjs";
import { delay, count } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";

export class LoggedWordToRouterLink {
  getRouterLink(word: string) {
    return undefined;
  }

  getQueryParam(word: string) {
    return undefined;
  }

  getBundleRouterLink(word: string, urlpart: string) {
    const bid = this.parseBundleId(word);
    if (bid) {
      return [urlpart, bid.dist, bid.num];
    }
    return undefined;
  }

  parseBundleId(bid: string): { dist: string; num: string } {
    const parts = bid.split(":");
    if (parts.length === 2 && parts[0] === "bundle") {
      const p2 = parts[1].split("/");
      if (p2.length === 2 && Number.parseInt(p2[1], 10)) {
        return { dist: p2[0], num: p2[1] };
      }
    }
    return undefined;
  }
}

@Injectable({
  providedIn: "root"
})
export class MessagesService {
  private messages = new BehaviorSubject<BackendLogEntry[]>([]);
  msgChanged = this.messages.asObservable();

  private wordMapper = new LoggedWordToRouterLink();
  private count = 0;
  private spinners: Map<number, string> = new Map();
  private spinnersSubject = new BehaviorSubject<string[]>([]);
  spinnerChanged = this.spinnersSubject.asObservable();

  constructor() {}

  addSpinner(message: string): number {
    const handle = this.count++;
    this.spinners.set(handle, message);
    // show spinner only for long running tasks >750ms
    of("")
      .pipe(delay(750))
      .subscribe(x => {
        if (this.spinners.has(handle)) this.emitSpinners();
      });
    return handle;
  }

  unsetSpinner(handle: number) {
    this.spinners.delete(handle);
    this.emitSpinners();
  }

  private emitSpinners() {
    const sp = Array.from(this.spinners.values()).sort();
    this.spinnersSubject.next(sp);
  }

  setError(message: string) {
    this.messages.next([{ logger: null, level: "ERROR", message: message }]);
  }

  setWarning(message: string) {
    this.messages.next([{ logger: null, level: "WARNING", message: message }]);
  }

  setErrorResponse(msg: string, errResp: HttpErrorResponse) {
    this.setError(
      `${msg}: ${errResp.status} ${errResp.statusText} (${errResp.error})`
    );
  }

  setMessages(messages: BackendLogEntry[]) {
    this.messages.next(messages);
  }

  clear() {
    this.messages.next([]);
  }

  setLoggedWordToRouterLink(wordMapper: LoggedWordToRouterLink) {
    this.wordMapper = wordMapper;
  }

  getRouterLink(word: string) {
    return this.wordMapper.getRouterLink(word);
  }

  getQueryParam(word: string) {
    return this.wordMapper.getQueryParam(word);
  }
}
