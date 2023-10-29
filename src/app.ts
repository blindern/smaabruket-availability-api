import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"
import {
  Availability,
  dateStartOfWeek,
  filterDays,
  isValidIsoDate,
} from "./availability"

process.on("SIGINT", () => {
  console.log("Received SIGINT - exiting")
  process.exit()
})

const spreadsheetId = process.env["SPREADSHEET_ID"]
if (spreadsheetId == null) {
  throw Error("Missing environment variable SPREADSHEET_ID")
}

const availability = new Availability(spreadsheetId)

const weeksShowBefore = 0
const weeksShowAfter = 25

function parseDate(value: string) {
  if (!isValidIsoDate(value)) {
    throw Error("Invalid date!")
  }
  return value
}

new Elysia()
  .use(cors())
  .get("/health", () => "I am alive!")
  .get("/", () => "See /availability")
  .get("/availability", async ({ set, query }) => {
    const first =
      typeof query["first"] === "string"
        ? parseDate(query["first"])
        : dateStartOfWeek(-weeksShowBefore)

    const until =
      typeof query["until"] === "string"
        ? parseDate(query["until"])
        : dateStartOfWeek(weeksShowAfter)

    try {
      const bookings = filterDays(await availability.getData(), first, until)
      return {
        bookings,
        first,
        until,
      }
    } catch (err) {
      console.log("Failed for some reason", err)
      set.status = 500
      return "Failed"
    }
  })
  .post("/availability/invalidate", () => {
    availability.invalidateCache()
    return { invalidated: true }
  })
  .listen(8000)

console.log("App running")
