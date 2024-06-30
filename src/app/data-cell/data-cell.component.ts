import { Component, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { IProcessedEventData } from '../model/processedEventData';

@Component({
  selector: 'app-data-cell',
  templateUrl: './data-cell.component.html',
  styleUrls: ['./data-cell.component.scss']
})
export class DataCellComponent implements OnChanges {
  @Input({ required: true }) data!: IProcessedEventData;
  @Input({ required: true }) maxEvents!: number;
  @Input({ required: true }) isNotes!: boolean;
  @Input({ required: true }) intensityFilter!: number;
  @Input({ required: true }) startDate!: string;
  @Input({ required: true }) endDate!: string;

  tooltip: string = '';
  bgColor!: string;
  filterType!: number;

  ngOnInit() {
    this.generateToolTip();
    this.getBgColor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['intensityFilter'] && !changes['intensityFilter'].firstChange) {
      this.getBgColor();
    }

    const startDateExist = changes['startDate'] && changes['startDate'].currentValue;
    const endDateExist = changes['endDate'] && changes['endDate'].currentValue;

    if (startDateExist && endDateExist && !this.isNotes) {
      this.checkDateRangeFilter();
    }
  }

  checkDateRangeFilter() {
    if (!this.isTimeStampInRange()) {
      this.tooltip = '';
      this.bgColor = 'white';
    } else {
      this.generateToolTip();
      this.getBgColor();
    }
  }

  isTimeStampInRange() {
    let startDate = new Date(this.startDate);
    let endDate = new Date(this.endDate);
    let timestamp = new Date(this.data.timestamp);

    if (startDate < endDate) {
      if (!(timestamp >= startDate && timestamp <= endDate)) {
        return false;
      }
    } else {
      if (!(timestamp >= endDate && timestamp <= startDate)) {
        return false;
      }
    }
    return true;
  }

  generateToolTip() {
    if (this.isNotes || (this.startDate && this.endDate && !this.isTimeStampInRange())) {
      return;
    }
    if (this.data.intensity === 0) {
      this.tooltip = `No Events Occured on ${this.getFormattedDate()}`;
    } else {
      this.tooltip = `${this.data.intensity} ${this.data.intensity > 1 ? 'events' : 'event'} occured on ${this.getFormattedDate()}`;
    }
  }

  getBgColor() {

    if (!this.isNotes && this.startDate && this.endDate && !this.isTimeStampInRange()) {
      return;
    }

    const intensityLevel = (this.data.intensity / this.maxEvents) * 100;

    if (intensityLevel === 0) {
      this.bgColor = `rgba(3, 160, 3, 0)`;
      this.filterType = 0;
    } else if (intensityLevel > 0 && intensityLevel <= 25) {
      this.bgColor = `rgba(3, 160, 3, 0.25)`;
      this.filterType = 1;
    } else if (intensityLevel >= 26 && intensityLevel <= 50) {
      this.bgColor = `rgba(3, 160, 3, 0.5)`;
      this.filterType = 2;
    } else if (intensityLevel >= 51 && intensityLevel <= 75) {
      this.bgColor = `rgba(3, 160, 3, 0.75)`;
      this.filterType = 3;
    } else if (intensityLevel >= 76 && intensityLevel <= 100) {
      this.bgColor = `rgba(3, 160, 3, 1)`;
      this.filterType = 4;
    }

    if (!this.isNotes && this.intensityFilter !== -1) {
      if (this.intensityFilter !== this.filterType) {
        this.bgColor = 'white';
      } else {
        this.bgColor = 'rgba(5, 5,  200, 0.25)';
      }
    }

  }

  getFormattedDate(): string {
    let date = new Date(this.data.timestamp);
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

}
