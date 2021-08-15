import * as fs from "fs"
import { Availability } from "./availability"

const testSpreadsheetId = "1RDCajU73u3TRhUv1M5DQchO_V7YgwTqdf5MZsMuIRfs"

const haveCredentials = fs.existsSync("credentials.json")
if (!haveCredentials) {
  console.log(
    "WARN: Skipping integration test in lack of credentials.json file",
  )
}

const itIfCredentials = haveCredentials ? it : it.skip

describe("class Availability", () => {
  describe("fetching data", () => {
    itIfCredentials("should properly fetch data for test sheet", async () => {
      const availability = new Availability(testSpreadsheetId)
      const res = await availability.getData()

      expect(res).toEqual([
        { from: "2018-05-06", type: "UTLEID", until: "2018-05-08" },
        { from: "2018-11-09", type: "HYTTESTYRET", until: "2018-11-11" },
        { from: "2018-12-08", type: "RESERVERT", until: "2018-12-09" },
        { from: "2018-12-15", type: "UTLEID", until: "2018-12-16" },
        { from: "2018-12-18", type: "RESERVERT-HS", until: "2018-12-19" },
        { from: "2018-12-20", type: "BEBOERHELG", until: "2018-12-22" },
      ])
    })
  })

  describe("function getType", () => {
    const av = new Availability("dummy")

    it("should give expected values", () => {
      expect(av.getType("HYTTESTYRET", undefined, undefined)).toBe(
        "HYTTESTYRET",
      )
      expect(av.getType("UTLEIE", undefined, undefined)).toBe("UTLEID")
      expect(av.getType("UTLEIE", "01.12.2018", "1000")).toBe("UTLEID")
      expect(av.getType("UTLEIE", "", "1000")).toBe("RESERVERT")
      expect(av.getType("UTLEIE", undefined, "1000")).toBe("RESERVERT")
      expect(av.getType("RESERVERT SOM BEBOERHELG", undefined, undefined)).toBe(
        "BEBOERHELG",
      )
      expect(av.getType("RESERVERT AV HYTTESTYRET", undefined, undefined)).toBe(
        "RESERVERT-HS",
      )
    })
  })
})
