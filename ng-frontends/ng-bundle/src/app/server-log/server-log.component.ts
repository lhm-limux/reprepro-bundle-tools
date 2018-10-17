import { Component, OnInit } from '@angular/core';
import { LogWatcherService } from './log-watcher.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'server-log',
  templateUrl: './server-log.component.html',
  styleUrls: ['./server-log.component.css']
})
export class ServerLogComponent implements OnInit {

  private sub: Subscription;
  public logs: string[] = [];

  constructor(private logWatcherService: LogWatcherService) { }

  ngOnInit() {
    this.sub = this.logWatcherService.getLog()
        .subscribe(log => {
          this.logs.push(log);
        });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
