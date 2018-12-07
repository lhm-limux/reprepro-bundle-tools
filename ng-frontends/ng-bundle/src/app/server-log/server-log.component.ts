/***********************************************************************
* Copyright (c) 2018 Landeshauptstadt München
*           (c) 2018 Christoph Lutz (InterFace AG)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the European Union Public Licence (EUPL),
* version 1.1 (or any later version).
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* European Union Public Licence for more details.
*
* You should have received a copy of the European Union Public Licence
* along with this program. If not, see
* https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
***********************************************************************/

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
