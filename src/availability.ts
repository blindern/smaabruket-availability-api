import request from 'request-promise-native'

const cacheExpireSeconds = 900

const columnLeiestart = 'A'
const columnLeieslutt = 'B'
const columnType = 'E'
const columnInnbetDato = 'H'
const columnInnbetBeloep = 'I'

enum BookingType {
  AVLYST = 'AVLYST',
  BEBOERHELG = 'BEBOERHELG',
  HYTTESTYRET = 'HYTTESTYRET',
  RESERVERT = 'RESERVERT',
  'RESERVERT-HS' = 'RESERVERT-HS',
  UTLEID = 'UTLEID',
}

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

interface ISpreadsheetFeed {
  feed: {
    entry: Array<{
      title: {
        /** Cell notation, e.g. A4 */
        $t: string
      }
      content: {
        /** Cell content */
        $t: string
      }
    }>
  }
}

export function isValidIsoDate(value: string) {
  if (!/^\d\d\d\d-\d\d-\d\d$/.test(value)) return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

function parseDate(value: string) {
  const match = value.match(/^(\d\d).(\d\d).(\d\d\d\d)$/)
  if (!match) return null

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
    booking =>
      // yyyy-mm-dd can be compared directly
      booking.from >= firstDate && booking.until < beforeDate,
  )
}

export class Availability {
  private url: string
  private cache: ICache | null = null

  constructor(url: string) {
    this.url = url
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
      return this.cache.data
    }
    const data = JSON.parse(await request.get(this.url)) as ISpreadsheetFeed

    const parsed = this.parseSpreadsheet(data)

    this.cache = {
      data: parsed,
      timestamp: new Date().getTime() / 1000,
    }

    return this.cache.data
  }

  private parseSpreadsheet(data: ISpreadsheetFeed) {
    return data.feed.entry
      .map(cell => {
        const cellNotation = this.parseCellNotation(cell.title.$t)
        if (cellNotation === null) return null
        const { row, column } = cellNotation
        return {
          column,
          content: cell.content.$t,
          row,
        }
      })
      .filter(notNull)
      .reduce(
        (acc, cell) => {
          acc[cell.row] = acc[cell.row] || {}
          acc[cell.row][cell.column] = cell.content
          return acc
        },
        [] as Array<{ [column: string]: string }>,
      )
      .filter(
        columns => columnLeiestart in columns && columnLeieslutt in columns,
      )
      .map<IBooking | null>(columns => {
        const from = parseDate(columns[columnLeiestart])
        const until = parseDate(columns[columnLeieslutt])

        if (from == null || until == null) return null

        return {
          from: formatDate(from),
          type: this.getType(
            columns[columnType],
            columns[columnInnbetDato],
            columns[columnInnbetBeloep],
          ),
          until: formatDate(until),
        }
      })
      .filter(notNull)
      .filter(booking => booking.type !== BookingType.AVLYST)
      .sort((a, b) => a.from.localeCompare(b.from))
  }

  private parseCellNotation(value: string) {
    const res = value.match(/^([A-Z]+)(\d+)$/)
    if (res == null) return null
    return {
      column: res[1],
      row: parseInt(res[2], 10),
    }
  }

  private getType(type?: string, innbetDato?: string, innbetBeloep?: string) {
    if (type == null || type === '') return BookingType.HYTTESTYRET

    const fixedTypes: { [key: string]: BookingType } = {
      AVLYST: BookingType.AVLYST,
      BEBOERHELG: BookingType.BEBOERHELG,
      HYTTESTYRET: BookingType.HYTTESTYRET,
      RESERVERT: BookingType['RESERVERT-HS'],
    }
    if (type in fixedTypes) return fixedTypes[type]

    return innbetBeloep == null ||
      innbetBeloep === '' ||
      (innbetDato != null && innbetDato !== '')
      ? BookingType.UTLEID
      : BookingType.RESERVERT
  }
}
