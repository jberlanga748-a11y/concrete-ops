import type { ExportRecordType } from "@/lib/exports/recordDocuments";

type SendRecordEmailInput = {
  to: string;
  subject: string;
  fileName: string;
  pdf: Buffer;
  recordType: ExportRecordType;
};

export async function sendRecordEmail(input: SendRecordEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { error: "Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL to enable sending." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: `<p>Your ${input.recordType.replace(/_/g, " ")} PDF is attached.</p>`,
      attachments: [
        {
          filename: input.fileName,
          content: input.pdf.toString("base64"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { error: body || "Email send failed." };
  }

  return { data: true };
}
