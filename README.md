# HeatMap Overview

## Default Heatmap Generation
The heatmap initially covers a one-year period from the current date, extending back 365 or 366 days. The leap year calculation determines the exact duration.

## Leap Year Calculation
If the current date is past January, the current year is used to determine if it's a leap year. Otherwise, the previous year is considered for this calculation.

## Live Event Updates
An automatic random event generator runs every 1 second. This generator updates the UI with live event data without requiring a full page refresh.

## Event Generation for Filters
- The default view and the current year filter both start the random event generator, displaying live event updates.
- The current year filter generates random events up to the current date.
- Other year filters display a heatmap with randomly generated data without live event updates.

## Year Filter Options
The heatmap includes a filter for the last five years, allowing users to view historical data.

## Tooltip Information
Hovering over a data cell displays a tooltip with detailed information about the date and the intensity of events.
