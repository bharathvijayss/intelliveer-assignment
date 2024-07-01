import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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

  @ViewChild('fromDatePicker', { static: true }) fromDatePicker!: ElementRef;
  @ViewChild('toDatePicker', { static: true }) toDatePicker!: ElementRef;
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
  active_intensity_filter: number = -1;
  minDate!: string;
  maxDate!: string;
  startDate: string = '';
  endDate: string = '';
  dateRangeFilterApplied: boolean = false;

  constructor(private appSrv: AppService) { }

  ngOnInit() {
    this.findDateRange();
    this.initWeekNames();
    this.initYearFilter();
    this.initMonthNames();
    this.initNotes();
    this.setMinMaxDate();
    this.initEventData();
  }

  intensityFilter(data: IProcessedEventData) {
    if (this.active_intensity_filter !== data.intensity) {
      this.active_intensity_filter = data.intensity;
      this.regenerateBgColors();
    }
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
    this.yearFilter = [];
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
    this.stopGettingDataAndResetFilters();
    this.activeYearFilter = appliedFilter.year;
    this.toDate = appliedFilter.toDate;
    this.fromDate = appliedFilter.fromDate;
    this.daysCount = this.getDaysCount(appliedFilter.year);
    this.initMonthNames();
    this.setMinMaxDate();
    this.initEventData();
  }

  setMinMaxDate() {
    this.minDate = this.fromDate.toISOString().split('T')[0];
    this.maxDate = this.toDate.toISOString().split('T')[0];
  }

  dateRangeFilter() {
    if (!this.startDate || !this.endDate) {
      alert('Both Start and End date is mandatory for applying date range filter')
      return;
    } else {
      this.startDate = `${this.startDate}T00:00:00`;
      this.endDate = `${this.endDate}T00:00:00`;
      this.dateRangeFilterApplied = true;
      this.regenerateBgColors();
    }
  }

  resetDateRangeFilter(resetBgColor: boolean) {
    this.fromDatePicker.nativeElement.value = '';
    this.toDatePicker.nativeElement.value = '';
    this.startDate = '';
    this.endDate = '';
    this.dateRangeFilterApplied = false;
    if (resetBgColor) {
      this.regenerateBgColors();
    }
  }

  getDaysCount(year: number): number {
    if ((year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0)) {
      return 366;
    }
    return 365;
  }

  initWeekNames() {
    this.dayNames = [];
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
      const res = this.getBgColor(note, this.maxNotesEvents, new Date(), true);
      this.notesdata[note] = {
        timestamp: new Date(),
        intensity: note,
        bgColor: res.bgColor,
        tooltip: res.tooltip
      }
    }
  }

  stopGettingDataAndResetFilters() {
    this.filterChanged = true;
    this.unsubscribeRandomDataGenerator();
    this.appSrv.stopRandomeDataGenerator();
    this.resetIntensityFilter(false);
    this.resetDateRangeFilter(false);
  }

  filterReset() {
    this.stopGettingDataAndResetFilters();
    this.ngOnInit();
  }

  resetIntensityFilter(resetBgColor: boolean) {
    this.active_intensity_filter = -1;
    if (resetBgColor) {
      this.regenerateBgColors();
    }
  }

  regenerateBgColors() {
    const dateRangeFilterExists = this.startDate && this.endDate && this.dateRangeFilterApplied;
    const startDate = dateRangeFilterExists ? new Date(this.startDate) : undefined;
    const endDate = dateRangeFilterExists ? new Date(this.endDate) : undefined;

    for (let i = 0; i < this.eventData.length; i++) {
      const { intensity, timestamp } = this.eventData[i];

      let updatedBgColor: string;
      let updatedToolTip: string;

      if ((!dateRangeFilterExists) || (dateRangeFilterExists && startDate && endDate && (timestamp >= startDate && timestamp <= endDate))) {
        const res = this.getBgColor(intensity, this.maxEvents, timestamp, false);
        updatedBgColor = res.bgColor;
        updatedToolTip = res.tooltip;
      } else {
        updatedBgColor = 'white';
        updatedToolTip = '';
      }

      this.eventData[i] = {
        intensity,
        timestamp,
        bgColor: updatedBgColor,
        tooltip: updatedToolTip
      }
    }
  }

  initEventData() {

    this.eventData = [];

    for (let i = 0; i < this.daysCount; i++) {
      this.eventData[i] = {
        timestamp: this.getTimeStamp(i),
        intensity: 0,
        bgColor: 'white',
        tooltip: ''
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
      let { timestamp, intensity, bgColor, tooltip } = this.eventData[index];
      intensity += 1;
      if (intensity > this.maxEvents) {
        this.maxEvents = intensity;
      }
      this.eventData[index] = {
        timestamp,
        intensity,
        bgColor,
        tooltip
      }
    }
    this.regenerateBgColors();
  }

  getBgColor(intensity: number, maxIntensity: number, timestamp: Date, isNotes: boolean): { tooltip: string, bgColor: string } {
    if (!isNotes && this.active_intensity_filter !== -1) {
      const intensityLevel = (intensity / maxIntensity) * 100;
      const filterType = this.getFilterType(intensityLevel);

      if (this.active_intensity_filter !== filterType) {
        return { bgColor: 'white', tooltip: '' };
      }

      // Special color for matching active intensity filter
      return { bgColor: 'rgba(5, 5, 200, 0.25)', tooltip: this.getToolTip(intensity, timestamp) };
    }

    // Calculate bgColor and tooltip normally
    return this.calculateBgColorAndToolTip(intensity, maxIntensity, timestamp, isNotes);
  }

  getFilterType(intensityLevel: number): number {
    if (intensityLevel === 0) return 0;
    if (intensityLevel <= 25) return 1;
    if (intensityLevel <= 50) return 2;
    if (intensityLevel <= 75) return 3;
    return 4;
  }

  calculateBgColorAndToolTip(intensity: number, maxIntensity: number, timestamp: Date, isNotes: boolean): { tooltip: string, bgColor: string } {
    const intensityLevel = (intensity / maxIntensity) * 100;
    let bgColor: string;
    let tooltip: string = '';

    if (intensityLevel === 0) {
      bgColor = `rgba(3, 160, 3, 0)`;
    } else if (intensityLevel <= 25) {
      bgColor = `rgba(3, 160, 3, 0.25)`;
    } else if (intensityLevel <= 50) {
      bgColor = `rgba(3, 160, 3, 0.5)`;
    } else if (intensityLevel <= 75) {
      bgColor = `rgba(3, 160, 3, 0.75)`;
    } else if (intensityLevel <= 100) {
      bgColor = `rgba(3, 160, 3, 1)`;
    } else {
      bgColor = 'white';
    }

    if (!isNotes) {
      tooltip = this.getToolTip(intensity, timestamp);
    }

    return { bgColor, tooltip };
  }

  getToolTip(intensity: number, timestamp: Date): string {
    if (intensity === 0) {
      return `No Events Occured on ${this.getFormattedDate(timestamp)}`;
    } else {
      return `${intensity} ${intensity > 1 ? 'events' : 'event'} occured on ${this.getFormattedDate(timestamp)}`;
    }
  }

  getFormattedDate(timestamp: Date): string {
    let date = new Date(timestamp);
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    const dayWithSuffix = this.getDayWithSuffix(day);
    return `${month} ${dayWithSuffix}, ${date.getFullYear()}`;
  }

  getDayWithSuffix(day: number): string {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
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
