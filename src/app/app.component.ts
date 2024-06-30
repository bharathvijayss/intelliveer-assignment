import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppService } from './app.service';
import { IEventData } from './model/EventData';
import { Subject, filter, takeUntil } from 'rxjs';
import { IProcessedEventData } from './model/processedEventData';
import { IYearFilter } from './model/YearFilter';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  eventData: IProcessedEventData[] = [];
  notesdata: IProcessedEventData[] = [];
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
  maxNotesEvents: number = 4;
  destroySubject: Subject<void> = new Subject<void>();
  yearFilter: IYearFilter[] = [];
  maxYearFilters: number = 5;
  activeYearFilter!: number;
  filterChanged: boolean = false;

  constructor(private appSrv: AppService) { }

  ngOnInit() {
    this.findDateRange();
    this.initWeekNames();
    this.initYearFilter();
    this.initMonthNames();
    this.initNotes();
    this.initEventData();
  }

  findDateRange() {
    this.toDate = new Date();
    this.toDate.setHours(0, 0, 0, 0);

    if (this.toDate.getMonth() + 1 > 1) {
      this.daysCount = this.getDaysCount(this.toDate.getFullYear());
    } else {
      this.daysCount = this.getDaysCount(this.toDate.getFullYear() - 1);
    }

    this.fromDate = new Date(this.toDate);
    this.fromDate = new Date(this.fromDate.setDate(this.toDate.getDate() - this.daysCount))
  }

  initYearFilter() {
    const date = new Date();
    const currentYear = date.getFullYear();
    this.activeYearFilter = currentYear;
    for (let i = 0; i < this.maxYearFilters; i++) {
      const year = currentYear - i;
      const fromDate = new Date(year, 0, 1, 0, 0, 0, 0);
      let toDate;
      if (year === currentYear) {
        toDate = new Date();
        toDate = new Date(toDate.setHours(0, 0, 0, 0));
      } else {
        toDate = new Date(year, 11, 31, 0, 0, 0, 0);
      }

      this.yearFilter.push({
        year,
        fromDate,
        toDate
      })
    }
  }

  yearFilterApplied(appliedFilter: IYearFilter) {
    this.filterChanged = true;
    this.unsubscribeRandomDataGenerator();
    this.appSrv.stopRandomeDataGenerator();
    this.activeYearFilter = appliedFilter.year;
    this.toDate = appliedFilter.toDate;
    this.fromDate = appliedFilter.fromDate;
    this.daysCount = this.getDaysCount(appliedFilter.year);
    this.initMonthNames();
    this.initEventData();
  }

  getDaysCount(year: number): number {
    if ((year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0)) {
      return 366;
    }
    return 365;
  }

  initWeekNames() {
    for (let weekName in this.weekDays) {
      if (this.weekDays[weekName]) {
        this.dayNames.push(weekName);
      } else {
        this.dayNames.push("");
      }
    }
  }

  initMonthNames() {
    this.monthNames = [];
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
  }

  initNotes() {
    for (let note = 0; note <= this.maxNotesEvents; note++) {
      this.notesdata[note] = {
        timestamp: new Date(),
        intensity: note
      }
    }
  }

  initEventData() {

    this.eventData = [];

    for (let i = 0; i < this.daysCount; i++) {
      this.eventData[i] = {
        timestamp: this.getTimeStamp(i),
        intensity: 0
      }
    }

    this.appSrv.setDateRange(this.fromDate, this.toDate, this.daysCount);

    this.appSrv.EventData$.pipe(takeUntil(this.destroySubject)).subscribe({
      next: (value: IEventData[]) => {
        this.processEvents(value);
      }
    })

    this.filterChanged = false;

    if (this.toDate.getFullYear() === new Date().getFullYear()) {
      this.appSrv.startRandomDataGenerator();
    } else {
      this.appSrv.generateMockData();
    }

  }

  processEvents(value: IEventData[]) {
    for (let val of value) {
      if (this.filterChanged) {
        return;
      }
      const index = this.findIndex(val.timestamp, this.fromDate);
      const { timestamp, intensity } = this.eventData[index];
      this.eventData[index] = {
        timestamp,
        intensity: intensity + 1
      }
      this.eventData[index].intensity += 1;
      if (this.eventData[index].intensity > this.maxEvents) {
        this.maxEvents = this.eventData[index].intensity;
      }
    }
  }

  findIndex(toDate: Date, fromDate: Date): number {
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getTimeStamp(index: number) {
    let date = new Date(this.fromDate);
    return new Date(date.setDate(date.getDate() + index));
  }

  ngOnDestroy(): void {
    this.unsubscribeRandomDataGenerator();
  }

  unsubscribeRandomDataGenerator() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

}
