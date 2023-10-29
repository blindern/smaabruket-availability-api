# smaabruket-availability-api

https://foreningenbs.no/smaabruket-availability-api/availability

https://foreningenbs.no/smaabruket-availability-api/availability?first=2018-01-01

## Development

```bash
bun install
export SPREADSHEET_ID='XXX'
bun run serve
```

http://localhost:8000/availability

The SPREADSHEET_ID should point to the ID of the spreadsheet, which can
be seen in the URL of the spreadsheet.

### Spreadsheet used in tests

This is a spreadsheet made for the purpose of integration testing.

https://docs.google.com/spreadsheets/d/1RDCajU73u3TRhUv1M5DQchO_V7YgwTqdf5MZsMuIRfs/edit?usp=sharing

## Credentials

A file `credentials.json` must exist in the working directory representing
the JSON file for a Service Account. The spreadsheet must be shared with
the email of this Service Account to grant it access.

This file is also required for running integration tests.

As of this writing we use the Service Account
`smaabruket-availability-api@foreningenbs.iam.gserviceaccount.com`.

## Named range in the spreadsheet

We retrieve data for the named range "Bookinger", which should cover
the range from the header row (just before data) and all the data,
and the columns as referenced in `availability.ts`.
