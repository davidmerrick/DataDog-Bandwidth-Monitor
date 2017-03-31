NodeJS app that does an Internet speed test and appends the results to a Google Spreadsheet.

Wrote this to monitor my Comcast download and upload speeds. Designed to be run on a Raspberry Pi with [Resin.io](https://resin.io/).

Runs continuously at an interval specified by the SPEED_TEST_INTERVAL_MIN environment variable (default is 15 min).

## Usage

Follow steps on https://developers.google.com/sheets/api/quickstart/nodejs to set up an app and get auth working.

Create a spreadsheet, copy the ID from the url (https://docs.google.com/spreadsheets/d/SHEET_ID), and set it as an environment variable called SHEET_ID.

Run 'npm start'
