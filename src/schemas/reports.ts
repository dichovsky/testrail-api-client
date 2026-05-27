import { z } from 'zod';
import { zObject } from './common.js';

// ── Report Schemas ────────────────────────────────────────────────────────────

/**
 * SPEC #2.1.16 — verified against the official TestRail "Reports and
 * Cross-Project Reports" API doc (support article 7077825062036) on
 * 2026-05-23. Per the "system fields always included in the response"
 * table, `get_reports` returns `id`, `name`, `description`, and six
 * `notify_*` fields. `id` and `name` are required scalars; `description`
 * is documented as a string but the doc example shows `"description":
 * null`, so `.nullish()` matches the wire. The six `notify_*` fields are
 * always-included per the doc, but modelled as `.nullish()` for
 * defensive back-compat: older TestRail versions may omit them and
 * `notify_link_recipients` is documented as a string that the doc
 * example also shows as `null`. `is_shared` is NOT in the current doc
 * field table; it remains `.nullish()` as a forward-compat placeholder.
 */
export const ReportSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    notify_user: z.boolean().nullish(),
    notify_link: z.boolean().nullish(),
    notify_link_recipients: z.string().nullish(),
    notify_attachment: z.boolean().nullish(),
    notify_attachment_html_format: z.boolean().nullish(),
    notify_attachment_pdf_format: z.boolean().nullish(),
    is_shared: z.boolean().nullish(),
});

export type Report = z.infer<typeof ReportSchema>;

/**
 * SPEC #2.1.16 — verified against the official TestRail "Reports and
 * Cross-Project Reports" API doc (support article 7077825062036) on
 * 2026-05-23. `run_report` returns three URLs per the current doc
 * example: `report_url` (the report view), `report_html`, and
 * `report_pdf`. `report_url` is required; `report_html` and `report_pdf`
 * are modelled as `.nullish()` since the endpoint requires TestRail 5.7+
 * and older servers may emit fewer keys. `user_report_url` is NOT in
 * the current doc but remains `.nullish()` as a forward/legacy-compat
 * placeholder for TestRail revisions that emitted it.
 */
export const ReportResultSchema = zObject({
    report_url: z.string(),
    report_html: z.string().nullish(),
    report_pdf: z.string().nullish(),
    user_report_url: z.string().nullish(),
});

export type ReportResult = z.infer<typeof ReportResultSchema>;
