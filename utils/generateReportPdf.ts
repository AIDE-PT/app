import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type NoteTitle = {
  date: string;
  title: string;
};

function applyInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h2>${applyInline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^###\s/.test(line)) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h3>${applyInline(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^[-•*]\s/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${applyInline(line.replace(/^[-•*]\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p>${applyInline(line)}</p>`);
    }
  }

  if (inList) out.push("</ul>");
  return out.join("\n");
}

function formatDate(isoDate: string): string {
  // "2026-06-18" → "18/06/2026"
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export async function generateReportPdf(opts: {
  patientName: string;
  generationDate: string;
  intervalStart: string;
  intervalEnd: string;
  reportMarkdown: string;
  noteTitles: NoteTitle[];
}): Promise<void> {
  const {
    patientName,
    generationDate,
    intervalStart,
    intervalEnd,
    reportMarkdown,
    noteTitles,
  } = opts;

  const asset = Asset.fromModule(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../assets/icon/icon.png"),
  );
  await asset.downloadAsync();

  let logoSrc = "";
  if (asset.localUri) {
    const b64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: "base64",
    });
    logoSrc = `data:image/png;base64,${b64}`;
  }

  const reportHtml = markdownToHtml(reportMarkdown);

  const notesRows = noteTitles
    .map(
      (n) =>
        `<tr><td class="dc">${formatDate(n.date)}</td><td>${n.title.replace(/</g, "&lt;")}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;padding:48px 52px;color:#1e293b;font-size:14px;line-height:1.6}
.hdr{display:flex;align-items:center;gap:18px;padding-bottom:18px;border-bottom:2.5px solid #5061FF;margin-bottom:28px}
.logo{width:62px;height:62px;object-fit:contain}
.hdr-txt .name{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:4px}
.hdr-txt .meta{font-size:12px;color:#64748b;margin-bottom:2px}
.hdr-txt .meta b{color:#334155}
h2{font-size:15px;font-weight:700;color:#1e293b;margin-top:24px;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
h3{font-size:14px;font-weight:600;color:#334155;margin-top:16px;margin-bottom:6px}
p{margin-bottom:10px;color:#334155}
ul{padding-left:22px;margin-bottom:12px}
li{margin-bottom:5px;color:#334155}
strong{color:#0f172a}
.notes{margin-top:36px;padding-top:24px;border-top:2px solid #e2e8f0}
.notes h2{color:#5061FF;border-bottom-color:#c7d2fe;margin-top:0}
table{width:100%;border-collapse:collapse;margin-top:12px}
tr:nth-child(even) td{background:#f8fafc}
td{padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top}
.dc{width:110px;color:#5061FF;font-weight:600;white-space:nowrap}
.footer{margin-top:48px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="hdr">
  ${logoSrc ? `<img class="logo" src="${logoSrc}"/>` : ""}
  <div class="hdr-txt">
    <p class="name">${patientName.replace(/</g, "&lt;")}</p>
    <p class="meta"><b>Gerado em:</b> ${generationDate}</p>
    <p class="meta"><b>Intervalo:</b> ${intervalStart} — ${intervalEnd}</p>
  </div>
</div>

${reportHtml}

${
  noteTitles.length > 0
    ? `<div class="notes">
  <h2>Notas Analisadas (${noteTitles.length})</h2>
  <table><tbody>${notesRows}</tbody></table>
</div>`
    : ""
}

<div class="footer">Gerado automaticamente · AIDE · ${generationDate}</div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Relatório — ${patientName}`,
    UTI: "com.adobe.pdf",
  });
}
