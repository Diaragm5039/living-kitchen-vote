import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("行程模板");
sheet.showGridLines = false;

const days = [
  ["DAY0", "7月31日"],
  ["DAY1", "8月1日"],
  ["DAY2", "8月2日"],
  ["DAY3", "8月3日"],
  ["DAY4", "8月4日"],
  ["DAY5", "8月5日"],
  ["DAY6", "8月6日"],
  ["DAY7", "8月7日"],
  ["DAY8", "8月8日"],
  ["DAY9", "8月9日"],
];

const rowsPerDay = 8;
const totalRows = 1 + days.length * rowsPerDay;

sheet.getRange("A1:G1").values = [["日期", "", "主题", "时间", "事宜", "交通", "备注说明"]];
sheet.getRange("A1:B1").merge();

sheet.getRange("A1:G1").format = {
  fill: "#00B050",
  font: { bold: true, color: "#FFFFFF", size: 12, name: "Microsoft YaHei" },
  horizontalAlignment: "center",
  verticalAlignment: "middle",
  borders: { preset: "all", style: "thin", color: "#404040" },
};

sheet.getRange("A:G").format = {
  font: { name: "Microsoft YaHei", size: 10 },
  verticalAlignment: "middle",
  wrapText: true,
};

sheet.getRange("A:A").format.columnWidth = 9;
sheet.getRange("B:B").format.columnWidth = 10;
sheet.getRange("C:C").format.columnWidth = 20;
sheet.getRange("D:D").format.columnWidth = 16;
sheet.getRange("E:E").format.columnWidth = 36;
sheet.getRange("F:F").format.columnWidth = 20;
sheet.getRange("G:G").format.columnWidth = 78;
sheet.getRange("1:1").format.rowHeight = 24;

const body = Array.from({ length: totalRows - 1 }, () => ["", "", "", "", "", "", ""]);
sheet.getRange(`A2:G${totalRows}`).values = body;

for (let i = 0; i < days.length; i += 1) {
  const startRow = 2 + i * rowsPerDay;
  const endRow = startRow + rowsPerDay - 1;
  const [dayLabel, dateLabel] = days[i];

  sheet.getRange(`A${startRow}:A${endRow}`).merge();
  sheet.getRange(`B${startRow}:B${endRow}`).merge();
  sheet.getRange(`C${startRow}:C${endRow}`).merge();

  sheet.getRange(`A${startRow}:B${startRow}`).values = [[dayLabel, dateLabel]];

  sheet.getRange(`A${startRow}:C${endRow}`).format = {
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    font: { name: "Microsoft YaHei", size: 10 },
  };

  sheet.getRange(`A${startRow}:G${endRow}`).format.borders = {
    preset: "all",
    style: "thin",
    color: "#404040",
  };

  sheet.getRange(`A${startRow}:G${startRow}`).format.borders = {
    top: { style: "medium", color: "#404040" },
    insideVertical: { style: "thin", color: "#404040" },
    insideHorizontal: { style: "thin", color: "#404040" },
    left: { style: "thin", color: "#404040" },
    right: { style: "thin", color: "#404040" },
    bottom: { style: "thin", color: "#404040" },
  };

  sheet.getRange(`A${startRow}:G${endRow}`).format.rowHeight = 23;
}

sheet.getRange(`A1:G${totalRows}`).format.borders = {
  preset: "all",
  style: "thin",
  color: "#404040",
};
sheet.getRange(`A1:G${totalRows}`).format.horizontalAlignment = "center";
sheet.getRange(`E2:E${totalRows}`).format.horizontalAlignment = "center";
sheet.getRange(`G2:G${totalRows}`).format.horizontalAlignment = "left";

sheet.freezePanes.freezeRows(1);

const preview = await workbook.render({
  sheetName: "行程模板",
  range: `A1:G${totalRows}`,
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/行程模板预览.png`, new Uint8Array(await preview.arrayBuffer()));

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/巴厘岛行程空白模板.xlsx`);
