# smaabruket-availability-api

[![CircleCI](https://circleci.com/gh/blindern/smaabruket-availability-api.svg?style=svg)](https://circleci.com/gh/blindern/smaabruket-availability-api)

## Developing

```bash
npm install
export SPREADSHEET_URL='XXX'
npm run serve
```

The SPREADSHEET_URL should point to the private shared JSON version of the
spreadsheet, and look something like this:

https://spreadsheets.google.com/feeds/cells/xxxxx/xxxx/public/basic?alt=json&max-col=10

## Deploying

Automated through CircleCI
