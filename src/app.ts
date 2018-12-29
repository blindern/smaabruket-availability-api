import express from 'express'
import {
  Availability,
  filterDays,
  dateStartOfWeek,
  isValidIsoDate,
} from './availability'

const spreadsheetUrl = process.env.SPREADSHEET_URL
if (spreadsheetUrl == null) {
  throw Error('Missing environment variable SPREADSHEET_URL')
}

const availability = new Availability(spreadsheetUrl)

const weeksShowBefore = 0
const weeksShowAfter = 25

const app = express()

app.get('/health', (req, res) => {
  res.send('I am alive!')
})

app.get('/', (req, res) => {
  res.send('See /availability')
})

function parseDate(value: string) {
  if (!isValidIsoDate(value)) {
    throw Error('Invalid date!')
  }
  return value
}

app.get('/availability', async (req, res) => {
  const first =
    req.query.first != null
      ? parseDate(req.query.first)
      : dateStartOfWeek(-weeksShowBefore)

  const until =
    req.query.until != null
      ? parseDate(req.query.until)
      : dateStartOfWeek(weeksShowAfter)

  try {
    const bookings = filterDays(await availability.getData(), first, until)
    res.json({
      first,
      until,
      bookings,
    })
  } catch (err) {
    console.log('Failed for some reason', err)
    res.status(500)
    res.send('Failed')
  }
})

app.post('/availability/invalidate', (req, res) => {
  availability.invalidateCache()
  res.json({ invalidated: true })
})

const server = app.listen(8000, () => {
  console.log('App running')
})
