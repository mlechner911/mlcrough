<!-- mlc-dochub:begin — auto-managed, do not edit between these markers -->
## MLC Doc Hub — mlcrough

Structured documentation lives in `.mlcai/`, maintained through the
`mlc-dochub` MCP server.

- **Project ID:** `mlcrough` — mlcrough — Sketchy SVG Graphics Library
- **Source directory:** `/mnt/data2tb/rough` (read source files with native Read —
  the MCP tools only touch `.mlcai/`)

### Existing docs

Read any of these directly (native Read is fine) to gather context before you work:

- `.mlcai/INTEGRATION.md` — How this project fits into the larger system
- `.mlcai/TECH_STACK.md` — Stack & dependencies
- `.mlcai/API_CONTRACT.md` — API contract / endpoints
- `.mlcai/DETAIL_DOCS.md` — Project detail docs (links to docs/)

### The rules themselves

The `mlc-dochub` server sends its full operating rules on connect, and most
clients place them in the system prompt — Claude Code and crush do (verified).
**Antigravity/`agy` does not** (verified 29.08.2026: it connects the server and
exposes its tools, but drops the server-level instructions). If you cannot see
them, this section is your copy:

- **Never write a `.mlcai/` file with a native editor.** Every create / update /
  delete goes through the MCP tools. They stamp the `## 📋 Meta` footer, append
  to the activity log and guard against concurrent edits. Reading with a native
  Read is fine and usually cheaper.
- **Pass `author="<your-model-name>"` on every write.**
- **Use the project id `mlcrough`.** Never invent `mlcrough-mac`, and
  never "fix" the registered path to your own filesystem — the registry is shared
  across every host, and machine-specific paths corrupt it for everyone else. A
  server-side path that does not exist on your machine is expected.
- **Three docs, three jobs.** `WORKLOG.md` is working memory — what is happening
  now and the next 1–3 steps, written at the END of a session, replaced wholesale
  by `update_worklog`. `PLAN.md` holds multi-phase plans, ticked off section by
  section with `update_section`. `BACKLOG.md` holds tickets, via the
  `*_backlog_item` tools. A vague todo → BACKLOG; a feature you are about to
  build → PLAN; "where I am right now" → WORKLOG.
- **Read before you write.** `get_doc` returns `last_modified`; pass it as
  `base_modified` on the next write so a concurrent edit is caught.
- **Writes are committed and pushed for you.** No git needed on `.mlcai/`. If a
  result says `[committed locally — PUSH FAILED …]`, tell the user.
- **If the tools are missing entirely, do not write** — read, and point the user
  at `task install-all` in the mlcintegration checkout (https://github.com/mlc911/mlcintegration).

`mcp__mlc-dochub__get_project_context` returns this project's metadata and style
guide; call it once before creating new docs.
<!-- mlc-dochub:end -->
