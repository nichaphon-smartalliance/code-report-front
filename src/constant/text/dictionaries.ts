/**
 * Every user-facing string in this app lives here. Nothing is hardcoded in a
 * component (SPEC-001 "Frontend"; FRONTEND-STANDARD §2).
 *
 * `th` is the default (REQ-001 §1 — Thai + English, switchable).
 *
 * NOTE FOR REVIEW (Q-FE-1): the wording below is copy Fern authored. REQ-001
 * and SPEC-001 specify which screens and fields exist, not their final labels,
 * and no Thai copy was supplied at all. Every string is one line in this one
 * module, so a reword is a copy edit. See TASK-006 `## Questions`.
 *
 * Server-produced error text is NEVER in this file: SPEC-001 says the backend
 * returns `{error:{code,message}}` already localised and the frontend displays
 * `message` as-is. The only error strings here are for failures that never
 * reach the server (the browser could not make the request at all).
 */
export const LANGUAGES = ["th", "en"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "th";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

const th = {
  "app.name": "KnowCode",
  "app.skipToContent": "ข้ามไปยังเนื้อหา",

  "header.languageLabel": "ภาษาของหน้าจอ",
  "header.language.th": "ไทย",
  "header.language.en": "อังกฤษ",
  "header.language.th.short": "TH",
  "header.language.en.short": "EN",
  "header.logout": "ออกจากระบบ",

  "login.heading": "เข้าสู่ระบบ",
  "login.username": "ชื่อผู้ใช้",
  "login.password": "รหัสผ่าน",
  "login.submit": "เข้าสู่ระบบ",
  "login.submitting": "กำลังเข้าสู่ระบบ",
  "login.sessionExpired": "เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
  "login.errorTitle": "เข้าสู่ระบบไม่สำเร็จ",

  "common.loading": "กำลังโหลด",
  "common.networkError": "ติดต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง",
  "common.optional": "ไม่บังคับ",

  "reports.new.heading": "สร้างรายงานใหม่",

  "reports.new.section.repository": "ที่เก็บโค้ด",
  "reports.new.repoUrl": "ที่อยู่ของ repository",
  "reports.new.repoUrl.placeholder": "https://github.com/org/project.git",
  "reports.new.private": "เป็น repository ส่วนตัว",
  "reports.new.pat": "Personal access token",
  "reports.new.pat.hint": "ใช้เฉพาะการสร้างรายงานครั้งนี้ ระบบไม่เก็บไว้ที่ใดเลย",

  "reports.new.section.period": "ช่วงเวลา",
  "reports.new.mode.label": "รูปแบบช่วงเวลา",
  "reports.new.mode.day": "วันเดียว",
  "reports.new.mode.range": "ช่วงวัน",
  "reports.new.date.day": "วันที่",
  "reports.new.date.from": "ตั้งแต่วันที่",
  "reports.new.date.to": "ถึงวันที่",
  "reports.new.date.hint": "นับตามวันในเขตเวลา Asia/Bangkok",

  "reports.new.section.filters": "ตัวกรอง",
  "reports.new.branch": "Branch",
  "reports.new.branch.hint": "เว้นว่างไว้เพื่อใช้ branch หลักของ repository",
  "reports.new.author": "ผู้เขียนคอมมิต",
  "reports.new.author.hint": "พิมพ์บางส่วนของชื่อหรืออีเมลก็ได้",

  "reports.new.section.report": "รายงาน",
  "reports.new.language.label": "ภาษาของรายงาน",
  "reports.new.language.hint": "แยกจากภาษาของหน้าจอ",
  "reports.new.extraContext": "ข้อมูลเพิ่มเติมสำหรับการวิเคราะห์",
  "reports.new.extraContext.hint": "เช่น สิ่งที่ทีมโฟกัสในช่วงนี้ หรือคำเฉพาะของโปรเจกต์",
  "reports.new.extraContext.counter": "ตัวอักษร",

  "reports.new.summary.heading": "สรุปก่อนสร้าง",
  "reports.new.summary.period": "ช่วงเวลา",
  "reports.new.summary.empty": "—",
  "reports.new.submit": "สร้างรายงาน",
  "reports.new.submitting": "กำลังส่งคำขอ",
  "reports.new.errorTitle": "สร้างรายงานไม่สำเร็จ",

  "reports.new.error.repoUrlRequired": "กรุณากรอกที่อยู่ของ repository",
  "reports.new.error.dateRequired": "กรุณาเลือกวันที่",
  "reports.new.error.dateOrder": "ต้องไม่อยู่ก่อนวันเริ่มต้น",
  "reports.new.error.dateSpan": "ช่วงวันต้องไม่เกิน 366 วัน",
  "reports.new.error.extraContextTooLong": "ข้อความยาวเกิน 8000 ตัวอักษร",
  "reports.new.error.checkFields": "กรุณาตรวจสอบข้อมูลในแบบฟอร์มอีกครั้ง",

  "reports.view.heading": "รายงาน",
  "reports.view.params.repo": "Repository",
  "reports.view.params.period": "ช่วงเวลา",
  "reports.view.params.branch": "Branch",
  "reports.view.params.author": "ผู้เขียนคอมมิต",
  "reports.view.params.language": "ภาษาของรายงาน",
  "reports.view.params.commits": "จำนวนคอมมิต",
  "reports.view.params.empty": "—",

  "reports.view.running.title": "กำลังสร้างรายงาน",
  "reports.view.running.hint": "หน้านี้จะอัปเดตเองจนกว่าจะเสร็จ เปิดค้างไว้ได้",
  "reports.view.progress.step": "ขั้นตอน",
  "reports.view.stage.CLONING": "ดึงข้อมูล repository",
  "reports.view.stage.READING_CODEBASE": "อ่านโครงสร้างโค้ด",
  "reports.view.stage.READING_COMMITS": "อ่านคอมมิตในช่วงเวลา",
  "reports.view.stage.AI_PROJECT": "วิเคราะห์ภาพรวมโปรเจกต์",
  "reports.view.stage.AI_COMMITS": "วิเคราะห์งานที่ทำ",
  "reports.view.stage.AI_WRITING": "เรียบเรียงรายงาน",
  "reports.view.state.done": "เสร็จแล้ว",
  "reports.view.state.current": "กำลังทำ",
  "reports.view.state.pending": "รอคิว",

  "reports.view.noCommits.title": "ไม่พบคอมมิตในช่วงเวลาที่เลือก",
  "reports.view.failed.title": "สร้างรายงานไม่สำเร็จ",
  "reports.view.tryAgain": "ลองอีกครั้ง",
  "reports.view.offline": "ติดต่อเซิร์ฟเวอร์ไม่ได้ กำลังลองใหม่",
} as const;

export type MessageKey = keyof typeof th;

const en: Record<MessageKey, string> = {
  "app.name": "KnowCode",
  "app.skipToContent": "Skip to content",

  "header.languageLabel": "Interface language",
  "header.language.th": "Thai",
  "header.language.en": "English",
  "header.language.th.short": "TH",
  "header.language.en.short": "EN",
  "header.logout": "Log out",

  "login.heading": "Log in",
  "login.username": "Username",
  "login.password": "Password",
  "login.submit": "Log in",
  "login.submitting": "Logging in",
  "login.sessionExpired": "Your session has expired. Please log in again.",
  "login.errorTitle": "Login failed",

  "common.loading": "Loading",
  "common.networkError": "Could not reach the server. Please try again.",
  "common.optional": "optional",

  "reports.new.heading": "New report",

  "reports.new.section.repository": "Repository",
  "reports.new.repoUrl": "Repository URL",
  "reports.new.repoUrl.placeholder": "https://github.com/org/project.git",
  "reports.new.private": "This is a private repository",
  "reports.new.pat": "Personal access token",
  "reports.new.pat.hint": "Used for this run only. It is never stored anywhere.",

  "reports.new.section.period": "Period",
  "reports.new.mode.label": "Period mode",
  "reports.new.mode.day": "Single day",
  "reports.new.mode.range": "Date range",
  "reports.new.date.day": "Day",
  "reports.new.date.from": "From",
  "reports.new.date.to": "To",
  "reports.new.date.hint": "Counted as the Asia/Bangkok day.",

  "reports.new.section.filters": "Filters",
  "reports.new.branch": "Branch",
  "reports.new.branch.hint": "Leave empty to use the repository’s default branch.",
  "reports.new.author": "Commit author",
  "reports.new.author.hint": "Part of a name or an email address is enough.",

  "reports.new.section.report": "Report",
  "reports.new.language.label": "Report language",
  "reports.new.language.hint": "Separate from the interface language.",
  "reports.new.extraContext": "Extra context for the analysis",
  "reports.new.extraContext.hint": "What the team was focused on, or vocabulary specific to this project.",
  "reports.new.extraContext.counter": "characters",

  "reports.new.summary.heading": "Before you run",
  "reports.new.summary.period": "Period",
  "reports.new.summary.empty": "—",
  "reports.new.submit": "Generate report",
  "reports.new.submitting": "Sending request",
  "reports.new.errorTitle": "Could not start the report",

  "reports.new.error.repoUrlRequired": "Enter the repository URL.",
  "reports.new.error.dateRequired": "Choose a date.",
  "reports.new.error.dateOrder": "Must not be before the start date.",
  "reports.new.error.dateSpan": "The range must not exceed 366 days.",
  "reports.new.error.extraContextTooLong": "Longer than 8000 characters.",
  "reports.new.error.checkFields": "Please check the highlighted fields.",

  "reports.view.heading": "Report",
  "reports.view.params.repo": "Repository",
  "reports.view.params.period": "Period",
  "reports.view.params.branch": "Branch",
  "reports.view.params.author": "Commit author",
  "reports.view.params.language": "Report language",
  "reports.view.params.commits": "Commits",
  "reports.view.params.empty": "—",

  "reports.view.running.title": "Generating the report",
  "reports.view.running.hint": "This page updates itself until the run finishes. You can leave it open.",
  "reports.view.progress.step": "Step",
  "reports.view.stage.CLONING": "Fetching the repository",
  "reports.view.stage.READING_CODEBASE": "Reading the codebase",
  "reports.view.stage.READING_COMMITS": "Reading the commits in the period",
  "reports.view.stage.AI_PROJECT": "Analysing the project",
  "reports.view.stage.AI_COMMITS": "Analysing the work done",
  "reports.view.stage.AI_WRITING": "Writing the report",
  "reports.view.state.done": "done",
  "reports.view.state.current": "in progress",
  "reports.view.state.pending": "waiting",

  "reports.view.noCommits.title": "No commits in the selected period",
  "reports.view.failed.title": "Could not generate the report",
  "reports.view.tryAgain": "Try again",
  "reports.view.offline": "Cannot reach the server — retrying.",
};

export const dictionaries: Record<Language, Record<MessageKey, string>> = { th, en };
