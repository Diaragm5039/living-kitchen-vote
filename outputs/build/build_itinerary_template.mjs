import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "../";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("行程模板");
sheet.showGridLines = false;

const days = [
  {
    day: "DAY0",
    date: "7月31日",
    topic: "飞行（北京-香港）",
    rows: [
      ["飞行（北京-香港）", "21:00-00:35（+1）", "北京首都T2 - 香港T1", "香港航空HX337", "3小时35分"],
    ],
  },
  {
    day: "DAY1",
    date: "8月1日",
    topic: "飞行（香港-巴厘岛）",
    rows: [
      ["飞行（香港-巴厘岛）", "02:00-07:05", "香港T2 - 巴厘岛伍拉赖机场", "香港航空HX707", "5小时5分"],
      ["接机", "07:50", "伍拉赖国际机场 - Arjuna Fast Cruise", "接机用车", "舒适型，预约成功"],
      ["快艇（巴厘岛-佩尼达岛）", "10:20-11:50", "巴厘岛沙努尔港 - 佩尼达岛", "瓦哈纳维伦德拉快艇", "11:00开船；需提前40分钟到；船程约50分钟；3人单程"],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["住宿", "入住15:00 / 次日12:00", "住宿：Kecamatan Nusa Penida的房源", "Airbnb", "房东：Jose Antonio；地址：80771 Jalan Ped-Buyuk, Ped"],
    ],
  },
  {
    day: "DAY2",
    date: "8月2日",
    topic: "",
    rows: rowsWithLast(8, ["住宿", "入住14:00 / 次日12:00", "住宿：乌布的房源", "Airbnb", "房东：Wayan；地址：Jalan Yudistira No.19"]),
  },
  {
    day: "DAY3",
    date: "8月3日",
    topic: "",
    rows: rowsWithLast(8, ["住宿", "入住14:00 / 次日12:00", "住宿：Kecamatan Kuta Utara的房源", "Airbnb", "房东：Sergey；地址：Gg. Kana Br. Tegal Gundul No.59"]),
  },
  {
    day: "DAY4",
    date: "8月4日",
    topic: "",
    rows: rowsWithLast(8, ["住宿", "入住15:00 / 次日12:00", "住宿：RIMBA - Wana Garden View Room", "酒店", "预订ID：AB-1ZM4HFYS；成人2人"]),
  },
  {
    day: "DAY5",
    date: "8月5日",
    topic: "飞行（巴厘岛-新加坡）",
    rows: [
      ["飞行（巴厘岛-新加坡）", "11:20-14:10", "巴厘岛伍拉赖机场 - 新加坡樟宜T1", "酷航TR281", "2小时50分"],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
    ],
  },
  { day: "DAY6", date: "8月6日", topic: "", rows: blankRows(8) },
  { day: "DAY7", date: "8月7日", topic: "", rows: blankRows(8) },
  { day: "DAY8", date: "8月8日", topic: "", rows: blankRows(8) },
  {
    day: "DAY9",
    date: "8月9日",
    topic: "飞行（新加坡-北京）",
    rows: [
      ["飞行（新加坡-北京）", "00:55-07:25", "新加坡樟宜T3 - 北京大兴", "东方航空MU5032", "6小时30分"],
    ],
  },
];

function blankRows(count) {
  return Array.from({ length: count }, () => ["", "", "", "", ""]);
}

function rowsWithLast(count, lastRow) {
  const rows = blankRows(count);
  rows[rows.length - 1] = lastRow;
  return rows;
}

const totalRows = 1 + days.reduce((sum, day) => sum + day.rows.length, 0);

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
sheet.getRange("C:C").format.columnWidth = 21;
sheet.getRange("D:D").format.columnWidth = 18;
sheet.getRange("E:E").format.columnWidth = 38;
sheet.getRange("F:F").format.columnWidth = 20;
sheet.getRange("G:G").format.columnWidth = 34;
sheet.getRange("1:1").format.rowHeight = 24;

let currentRow = 2;
for (const day of days) {
  const rowCount = day.rows.length;
  const startRow = currentRow;
  const endRow = currentRow + rowCount - 1;

  sheet.getRange(`A${startRow}:G${endRow}`).values = day.rows.map((row) => [
    "",
    "",
    row[0],
    row[1],
    row[2],
    row[3],
    row[4],
  ]);

  if (rowCount > 1) {
    sheet.getRange(`A${startRow}:A${endRow}`).merge();
    sheet.getRange(`B${startRow}:B${endRow}`).merge();
    sheet.getRange(`C${startRow}:C${endRow}`).merge();
  }

  sheet.getRange(`A${startRow}:B${startRow}`).values = [[day.day, day.date]];
  if (day.topic) {
    sheet.getRange(`C${startRow}`).values = [[day.topic]];
  }

  sheet.getRange(`A${startRow}:G${endRow}`).format = {
    borders: { preset: "all", style: "thin", color: "#404040" },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    wrapText: true,
    font: { name: "Microsoft YaHei", size: 10 },
  };

  sheet.getRange(`A${startRow}:G${startRow}`).format.borders = {
    top: { style: "medium", color: "#404040" },
    insideVertical: { style: "thin", color: "#404040" },
    insideHorizontal: { style: "thin", color: "#404040" },
    left: { style: "thin", color: "#404040" },
    right: { style: "thin", color: "#404040" },
    bottom: { style: "thin", color: "#404040" },
  };

  const rowHeight = rowCount === 1 ? 32 : 24;
  sheet.getRange(`A${startRow}:G${endRow}`).format.rowHeight = rowHeight;
  day.rows.forEach((row, index) => {
    if (row[4] && row[4].length > 20) {
      sheet.getRange(`A${startRow + index}:G${startRow + index}`).format.rowHeight = 34;
    }
  });

  currentRow = endRow + 1;
}

sheet.getRange(`A1:G${totalRows}`).format.borders = {
  preset: "all",
  style: "thin",
  color: "#404040",
};
sheet.getRange(`A1:G${totalRows}`).format.horizontalAlignment = "center";
sheet.getRange(`G2:G${totalRows}`).format.horizontalAlignment = "left";
sheet.freezePanes.freezeRows(1);

const check = await workbook.inspect({
  kind: "table",
  range: `行程模板!A1:G${totalRows}`,
  include: "values,formulas",
  tableMaxRows: totalRows,
  tableMaxCols: 7,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "行程模板",
  range: `A1:G${totalRows}`,
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/行程模板机票版预览.png`, new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/巴厘岛行程机票版.xlsx`);
