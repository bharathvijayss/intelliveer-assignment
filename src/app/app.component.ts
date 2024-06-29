import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppService } from './app.service';
import { IEventData } from './model/EventData';
import { Subject, takeUntil } from 'rxjs';
import { IProcessedEventData } from './model/processedEventData';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  eventData: IProcessedEventData[] = [];
  daysCount!: number;
  daysInWeek: number = 7;
  weeksInYear: number = 52;
  dayNames: string[] = [];
  monthNames: string[] = [];
  toDate!: Date;
  fromDate!: Date;
  weekDays: { [key: string]: boolean } = {
    'Sun': false,
    'Mon': true,
    "Tue": false,
    'Wed': true,
    'Thu': false,
    'Fri': true,
    'Sat': false
  }
  maxEvents: number = 0;
  destroySubject: Subject<void> = new Subject<void>();

  constructor(private appSrv: AppService) { }

  ngOnInit() {
    this.toDate = new Date();
    this.toDate.setHours(0, 0, 0, 0);

    let isLeapYear: boolean;
    if (this.toDate.getMonth() + 1 > 1) {
      isLeapYear = this.isLeapYear(this.toDate.getFullYear());
    } else {
      isLeapYear = this.isLeapYear(this.toDate.getFullYear() - 1);
    }

    if (isLeapYear) {
      this.daysCount = 366;
    } else {
      this.daysCount = 365;
    }

    this.fromDate = new Date(this.toDate);
    this.fromDate = new Date(this.fromDate.setDate(this.toDate.getDate() - this.daysCount))

    for (let i = 0; i < this.daysCount; i++) {
      this.eventData[i] = {
        timestamp: this.getTimeStamp(i),
        intensity: 0
      }
    }

    for (let weekName in this.weekDays) {
      if (this.weekDays[weekName]) {
        this.dayNames.push(weekName);
      } else {
        this.dayNames.push("");
      }
    }

    let months = new Set<string>([]);

    for (let weekNo = 1; weekNo <= this.weeksInYear; weekNo++) {
      let date = new Date(this.fromDate);
      date = new Date(date.setDate(date.getDate() + this.daysInWeek * (weekNo)));
      const shortMonthName = date.toLocaleString('default', { month: 'short' });
      if (!months.has(shortMonthName)) {
        months.add(shortMonthName)
        this.monthNames.push(shortMonthName);
      } else {
        this.monthNames.push("");
      }
    }

    this.appSrv.setDateRange(this.fromDate, this.toDate, this.daysCount);

    this.appSrv.EventData$.pipe(takeUntil(this.destroySubject)).subscribe({
      next: (value: IEventData[]) => {        
        this.processEvents(value);
      }
    })

  }

  processEvents(value: IEventData[]) {
    for (let val of value) {
      const index = this.findIndex(val.timestamp);
      this.eventData[index].intensity += 1;
      if (this.eventData[index].intensity > this.maxEvents) {
        this.maxEvents = this.eventData[index].intensity;
      }
    }
  }

  findIndex(timestamp: Date): number {
    const diffTime = Math.abs(timestamp.getTime() - this.fromDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  isLeapYear(year: number): boolean {
    if ((year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0)) {
      return true;
    }
    return false;
  }

  getTimeStamp(index: number) {
    let date = new Date(this.fromDate);
    return new Date(date.setDate(date.getDate() + index));
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

}
