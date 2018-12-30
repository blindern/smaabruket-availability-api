# smaabruket-availability-api

[![CircleCI](https://circleci.com/gh/blindern/smaabruket-availability-api.svg?style=svg)](https://circleci.com/gh/blindern/smaabruket-availability-api)

https://foreningenbs.no/smaabruket-availability-api/availability

https://foreningenbs.no/smaabruket-availability-api/availability?first=2018-01-01

## Developing

```bash
npm install
export SPREADSHEET_URL='XXX'
npm run serve
```

http://localhost:8000/availability

The SPREADSHEET_URL should point to the private shared JSON version of the
spreadsheet, and look something like this:

https://spreadsheets.google.com/feeds/cells/xxxxx/xxxx/public/basic?alt=json&max-col=10

### Spreadsheet used in tests

This is a spreadsheet made for the purpose of integration testing.

https://docs.google.com/spreadsheets/d/1RDCajU73u3TRhUv1M5DQchO_V7YgwTqdf5MZsMuIRfs/edit?usp=sharing

https://spreadsheets.google.com/feeds/cells/1RDCajU73u3TRhUv1M5DQchO_V7YgwTqdf5MZsMuIRfs/od6/public/basic?alt=json&max-col=10

## Deploying

Automated through CircleCI
