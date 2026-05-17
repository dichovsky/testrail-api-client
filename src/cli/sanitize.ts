/**
 * Strip terminal control characters from a string before printing to
 * stdout/stderr. Defends against ANSI/OSC injection where a remote
 * source (TestRail field values, server error messages, user argv
 * echoed back via validation errors) embeds escape sequences that the
 * receiving terminal then executes — recolouring, cursor movement,
 * window-title spoofing (`ESC ] 0 ; …`), or even arbitrary command
 * injection via OSC 7 / OSC 9 / iTerm2 dynamic-action escape codes.
 *
 * CTF audit findings #16 (stderr error messages) and #18 (`--format
 * table` cell values + headers) share this sanitizer.
 *
 * Strategy: strict denylist. Strip all C0 controls (U+0000–U+001F),
 * DEL (U+007F), and C1 controls (U+0080–U+009F). C0 covers ESC (0x1B),
 * BEL (0x07), CR (0x0D), LF (0x0A), TAB (0x09), and the rest of the
 * low control band; C1 covers the 8-bit OSC-introducer alternate
 * (0x9D) that some terminals honour. Printable Unicode is preserved,
 * including non-Latin scripts.
 *
 * Trade-off: LF and TAB are stripped too. The CLI's natural
 * line/column structure comes from explicit `\n` and ` | ` literals in
 * output.ts; payload-embedded newlines and tabs would only damage that
 * structure (a TestRail field value containing `\n` would break the
 * one-row-per-line table assumption). For long-form values that
 * legitimately contain newlines, callers should switch to
 * `--format json` where the newline is JSON-escaped to `\n` and
 * remains visible without executing on the terminal.
 */
export function sanitizeForTerminal(s: string): string {
    // eslint-disable-next-line no-control-regex
    return s.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}
