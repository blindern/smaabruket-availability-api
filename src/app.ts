import cors from "cors"
import express from "express"
import {
  Availability,
  dateStartOfWeek,
  filterDays,
  isValidIsoDate,
} from "./availability"

const spreadsheetId = process.env.SPREADSHEET_ID
if (spreadsheetId == null) {
  throw Error("Missing environment variable SPREADSHEET_ID")
}

const availability = new Availability(spreadsheetId)

const weeksShowBefore = 0
const weeksShowAfter = 25

const app = express()
app.use(cors())

app.get("/health", (req, res) => {
  res.send("I am alive!")
})

app.get("/", (req, res) => {
  res.send("See /availability")
})

function parseDate(value: string) {
  if (!isValidIsoDate(value)) {
    throw Error("Invalid date!")
  }
  return value
}

app.get("/availability", async (req, res) => {
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
      bookings,
      first,
      until,
    })
  } catch (err) {
    console.log("Failed for some reason", err)
    res.status(500)
    res.send("Failed")
  }
})

app.post("/availability/invalidate", (req, res) => {
  availability.invalidateCache()
  res.json({ invalidated: true })
})

app.listen(8000, () => {
  console.log("App running")
})
