import type ExcelJS from "exceljs";

// Normalize an ExcelJS cell value to a plain primitive. ExcelJS returns
// objects for richtext / hyperlink / formula cells and Date objects for date
// cells; every importer here wants the flat value.
export function cellToPrimitive(v: unknown): string | number | boolean {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (Array.isArray(obj.richText)) return (obj.richText as Array<{ text?: string }>).map((r) => r.text ?? "").join("");
    if (typeof obj.text === "string") return obj.text;
    if (obj.result !== undefined) return cellToPrimitive(obj.result);
    // A string `text` already returned above, so a hyperlink cell that reaches
    // here has none worth showing.
    if (typeof obj.hyperlink === "string") return obj.hyperlink;
    return "";
  }
  return v as string | number | boolean;
}

/** Reads row 1 as headers and returns each following row keyed by header. */
export function sheetToObjects(sheet: ExcelJS.Worksheet | undefined): Record<string, unknown>[] {
  if (!sheet) return [];
  const headers: string[] = [];
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = row.values as unknown[]; // ExcelJS row.values is 1-indexed
    if (rowNumber === 1) {
      for (let i = 1; i < values.length; i++) {
        headers[i - 1] = String(values[i] ?? "").trim();
      }
      return;
    }
    const obj: Record<string, unknown> = {};
    for (let i = 1; i < values.length; i++) {
      const key = headers[i - 1];
      if (!key) continue;
      obj[key] = cellToPrimitive(values[i]);
    }
    rows.push(obj);
  });
  return rows;
}
