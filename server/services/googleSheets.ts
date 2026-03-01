import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

let doc: GoogleSpreadsheet | null = null;

async function getDoc() {
  if (doc) return doc;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !key || !sheetId) {
    throw new Error("Missing Google Sheets configuration. Please check GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID.");
  }

  const serviceAccountAuth = new JWT({
    email,
    key,
    scopes: SCOPES,
  });

  doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

export async function getSheet() {
  const document = await getDoc();
  const sheet = document.sheetsByTitle["Submissions"];
  if (!sheet) {
    throw new Error("Sheet tab 'Submissions' not found. Please ensure your Google Sheet has a tab named 'Submissions'.");
  }
  return sheet;
}

export interface Submission {
  timestamp: string;
  name: string;
  email: string;
  subject: string;
  pdfLink: string;
  status: "Active" | "Warning" | "Removed";
  adminNotes: string;
  id: string;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  
  return rows.map((row) => ({
    timestamp: row.get("Timestamp") || "",
    name: row.get("Name") || "",
    email: row.get("Email") || "",
    subject: row.get("Subject") || "",
    pdfLink: row.get("PDF_Link") || "",
    status: (row.get("Status") as any) || "Active",
    adminNotes: row.get("Admin_Notes") || "",
    id: row.get("ID") || "",
  }));
}

export async function updateSubmission(id: string, updates: Partial<Submission>) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("ID") === id);
  
  if (row) {
    if (updates.status) row.set("Status", updates.status);
    if (updates.adminNotes !== undefined) row.set("Admin_Notes", updates.adminNotes);
    if (updates.name) row.set("Name", updates.name);
    if (updates.subject) row.set("Subject", updates.subject);
    await row.save();
    return true;
  }
  return false;
}

export async function deleteSubmission(id: string) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("ID") === id);
  
  if (row) {
    await row.delete();
    return true;
  }
  return false;
}
