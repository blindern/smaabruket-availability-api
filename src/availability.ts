import { sheets_v4 } from "@googleapis/sheets"
import { record, setAttributes } from "@elysiajs/opentelemetry"
import { GoogleAuth } from "google-auth-library"

const cacheExpireSeconds = 900

function columnIndexByChar(char: string): number {
  return char.charCodeAt(0) - "A".charCodeAt(0)
}

// This assumes the named range actually starts as A,
// to be comparable with the spreadsheet view.
const columnLeiestart = columnIndexByChar("A")
const columnLeieslutt = columnIndexByChar("B")
const columnType = columnIndexByChar("E")
const columnInnbetDato = columnIndexByChar("H")
const columnInnbetBeloep = columnIndexByChar("I")

export const BookingType = {
  AVLYST: "AVLYST",
  BEBOERHELG: "BEBOERHELG",
  HYTTESTYRET: "HYTTESTYRET",
  RESERVERT: "RESERVERT",
  "RESERVERT-HS": "RESERVERT-HS",
  UTLEID: "UTLEID",
} as const

export type BookingType = (typeof BookingType)[keyof typeof BookingType]

interface IBooking {
  /** yyyy-mm-dd */
  from: string
  /** yyyy-mm-dd */
  until: string
  type: BookingType
}

interface ICache {
  timestamp: number
  data: IBooking[]
}

export function isValidIsoDate(value: string) {
  if (!/^\d\d\d\d-\d\d-\d\d$/.test(value)) return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

function parseDate(value: string) {
  const match = /^(\d\d).(\d\d).(\d\d\d\d)$/.exec(value)
  if (!match) return null

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return new Date(`${match[3]}-${match[2]}-${match[1]}`)
}

function formatDate(date: Date) {
  return date.toISOString().substring(0, 10)
}

function weekDayOffset(date: Date) {
  const day = date.getDay()
  if (day === 0) return 7
  return day
}

function startOfWeek(unixTimestamp: number) {
  const date = new Date(unixTimestamp)
  date.setDate(date.getDate() - (weekDayOffset(date) - 1))
  return date.getTime()
}

function notNull<TValue>(value: TValue | null): value is TValue {
  return value != null
}

export function dateStartOfWeek(weekOffset: number) {
  return formatDate(
    new Date(startOfWeek(new Date().getTime() + weekOffset * 1000 * 7 * 86400)),
  )
}

export function filterDays(
  data: IBooking[],
  firstDate: string,
  beforeDate: string,
) {
  return data.filter(
    (booking) =>
      // yyyy-mm-dd can be compared directly
      // compare with overlap
      booking.until >= firstDate && booking.from < beforeDate,
  )
}

export class Availability {
  private spreadsheetId: string
  private cache: ICache | null = null

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId
  }

  private isExpired() {
    if (this.cache == null) return true

    const now = new Date().getTime() / 1000
    const ageSeconds = now - this.cache.timestamp
    return ageSeconds > cacheExpireSeconds || ageSeconds < 0
  }

  public invalidateCache() {
    this.cache = null
  }

  public async getData() {
    if (this.cache != null && !this.isExpired()) {
      setAttributes({ "cache.hit": true })
      return this.cache.data
    }
    setAttributes({ "cache.hit": false })

    const res = await record("google.sheets.get", async () => {
      const auth = new GoogleAuth({
        keyFilename: "credentials.json",
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      })

      const client = new sheets_v4.Sheets({
        auth,
      })

      setAttributes({ "sheets.spreadsheetId": this.spreadsheetId })

      return client.spreadsheets.values.get({
        // Named range in the spreadsheet.
        range: "Bookinger",
        spreadsheetId: this.spreadsheetId,
      })
    })

    const parsed = record("availability.parse", () => {
      const result = this.parseSpreadsheet(res.data)
      setAttributes({ "parse.rowCount": result.length })
      return result
    })

    this.cache = {
      data: parsed,
      timestamp: new Date().getTime() / 1000,
    }

    return this.cache.data
  }

  private parseSpreadsheet(data: sheets_v4.Schema$ValueRange) {
    return data
      .values!.filter(
        (columns) => columnLeiestart in columns && columnLeieslutt in columns,
      )
      .map<IBooking | null>((columns) => {
        const from = parseDate(columns[columnLeiestart] as string)
        const until = parseDate(columns[columnLeieslutt] as string)

        if (from == null || until == null) return null

        return {
          from: formatDate(from),
          type: this.getType(
            columns[columnType] as string | undefined,
            columns[columnInnbetDato] as string | undefined,
            columns[columnInnbetBeloep] as string | undefined,
          ),
          until: formatDate(until),
        }
      })
      .filter(notNull)
      .filter((booking) => booking.type !== BookingType.AVLYST)
      .sort((a, b) => a.from.localeCompare(b.from))
  }

  public getType(type?: string, innbetDato?: string, innbetBeloep?: string) {
    if (type == null || type === "") return BookingType.HYTTESTYRET

    const fixedTypes: Record<string, BookingType> = {
      AVLYST: BookingType.AVLYST,
      BEBOERHELG: BookingType.BEBOERHELG,
      HYTTESTYRET: BookingType.HYTTESTYRET,
      RESERVERT: BookingType["RESERVERT-HS"],
      "RESERVERT SOM BEBOERHELG": BookingType.BEBOERHELG,
      "RESERVERT AV HYTTESTYRET": BookingType["RESERVERT-HS"],
    }

    const found = fixedTypes[type]
    if (found != null) {
      return found
    }

    return innbetBeloep == null ||
      innbetBeloep === "" ||
      (innbetDato != null && innbetDato !== "")
      ? BookingType.UTLEID
      : BookingType.RESERVERT
  }
}
