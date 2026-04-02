import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { dataUrlToUint8Array } from "./emergencyAuditFormat";

export type AuditLogEntryDocx = {
  name: string;
  time: string;
  step: string;
  snapshotBase64: string;
};

export async function generateAuditReportBlob(
  logs: AuditLogEntryDocx[]
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Medical Procedure Audit Report",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({ children: [new TextRun({ text: "" })] }),
  ];

  for (const log of logs) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Doctor: ${log.name}`, bold: true })],
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Step: ${log.step}` })],
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Time: ${log.time}` })],
      })
    );

    const bytes = dataUrlToUint8Array(log.snapshotBase64);
    if (bytes && bytes.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: "jpg",
              data: bytes,
              transformation: { width: 320, height: 240 },
            }),
          ],
        })
      );
    }
    children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
