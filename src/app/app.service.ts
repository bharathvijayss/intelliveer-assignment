import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IEventData } from './model/EventData';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  fromDate!: Date;
  toDate!: Date;
  daysCount!: number;
  private eventData$: BehaviorSubject<IEventData[]> = new BehaviorSubject<IEventData[]>([]);
  intervalId!: any;

  get EventData$(): Observable<IEventData[]> {
    return this.eventData$.asObservable();
  }

  constructor() { }

  startRandomDataGenerator() {
    this.stopRandomeDataGenerator();
    this.intervalId = setInterval(() => {
      this.generateMockData();
    }, 1000)
  }

  stopRandomeDataGenerator() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  setDateRange(startDate: Date, endDate: Date, daysCount: number) {
    this.fromDate = startDate;
    this.toDate = endDate;
    this.daysCount = daysCount;
  }

  generateMockData() {

    const mockData: IEventData[] = [];

    for (let i = 0; i < this.daysCount; i++) {
      mockData.push({
        timestamp: this.getRandomDate()
      });
    }

    this.eventData$.next(mockData)
  }

  private getRandomDate(): Date {
    let date: Date = new Date(this.fromDate.getTime() + Math.random() * (this.toDate.getTime() - this.fromDate.getTime()))
    date.setHours(0, 0, 0, 0);
    return date;
  }

}
