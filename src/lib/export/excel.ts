import ExcelJS from 'exceljs'

export type ExcelColumn<Row> = {
  header: string
  /** Column width in characters. */
  width?: number
  value: (row: Row) => string | number | boolean | Date | null | undefined
  /** Excel number format, e.g. `#,##0` or `dd mmm yyyy`. */
  numFmt?: string
}

export type ExcelSheet<Row> = {
  name: string
  columns: ExcelColumn<Row>[]
  rows: Row[]
}

const NAVY = 'FF14213D'

/** Builds an .xlsx workbook with a styled, frozen, filterable header row on each sheet. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each sheet has its own row type
export async function buildWorkbook(sheets: ExcelSheet<any>[], meta?: { title?: string; creator?: string }) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = meta?.creator ?? 'DMRC admin'
  workbook.created = new Date()
  if (meta?.title) workbook.title = meta.title

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    worksheet.columns = sheet.columns.map((column, index) => ({
      header: column.header,
      key: `c${index}`,
      width: column.width ?? Math.max(12, column.header.length + 4),
      style: column.numFmt ? { numFmt: column.numFmt } : undefined,
    }))

    for (const row of sheet.rows) {
      const values: Record<string, unknown> = {}
      sheet.columns.forEach((column, index) => {
        const value = column.value(row)
        values[`c${index}`] = value ?? ''
      })
      worksheet.addRow(values)
    }

    const header = worksheet.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    header.alignment = { vertical: 'middle' }
    header.height = 22
    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } }

    // Zebra striping keeps long sheets readable when printed.
    for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 2) {
      worksheet.getRow(rowNumber).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F0' } }
    }
    if (!sheet.rows.length) {
      worksheet.addRow({ c0: 'No records match these filters.' }).font = { italic: true, color: { argb: 'FF6B7280' } }
    }
  }

  return workbook.xlsx.writeBuffer()
}

/** A download response for a workbook buffer. */
export function excelResponse(buffer: ArrayBuffer | Buffer, filename: string) {
  const safeName = filename.replace(/[^a-z0-9._-]+/gi, '-')
  return new Response(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export const exportFilename = (dataset: string) => `dmrc-${dataset}-${new Date().toISOString().slice(0, 10)}.xlsx`
