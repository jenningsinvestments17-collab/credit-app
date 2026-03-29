import { bureauRecipients } from "@/lib/disputes/mailing";
import { defaultSenderAddress } from "@/lib/mailing/sender";
import type { Bureau, DisputeVersionRecord, Lead, PostalAddress } from "@/lib/types";

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function buildMailingAddressBlock(address: PostalAddress) {
  return [address.name, address.street1, address.street2, `${address.city}, ${address.state} ${address.postalCode}`]
    .filter(Boolean)
    .join("\n");
}

export function renderDisputePdfContent(version: DisputeVersionRecord, lead: Lead, bureau?: Bureau) {
  const recipient = bureau ? bureauRecipients[bureau] : null;
  const lines = [
    `Credu Consulting - Final Mailing Version`,
    `Client: ${lead.fullName}`,
    `Sender:\n${buildMailingAddressBlock(defaultSenderAddress)}`,
    recipient ? `Recipient:\n${buildMailingAddressBlock({
      name: recipient.recipientName,
      street1: recipient.street1,
      street2: recipient.street2,
      city: recipient.city,
      state: recipient.state,
      postalCode: recipient.postalCode,
    })}` : null,
    `Version: ${version.versionNumber}`,
    `Generated: ${version.createdAt}`,
    "",
    ...version.letterText.split("\n"),
  ].filter(Boolean) as string[];

  return lines.join("\n");
}

export function generateSimplePdfBuffer(content: string) {
  const safeText = escapePdfText(content);
  const stream = `BT /F1 11 Tf 50 760 Td (${safeText.replaceAll("\n", ") Tj T* (")}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
