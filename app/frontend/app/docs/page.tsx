"use client";
import { useState } from "react";
import { s } from "@/styles/docs";

const SECTIONS = [
  { id: "overview",    label: "Overview" },
  { id: "connections", label: "Connections" },
  { id: "extract",     label: "Extracting data" },
  { id: "grid",        label: "Editing the grid" },
  { id: "submit",      label: "Submitting & exporting" },
  { id: "files",       label: "File access" },
  { id: "rbac",        label: "Roles & permissions" },
  { id: "limits",      label: "Limits & tips" },
];

export default function DocsPage() {
  const [active, setActive] = useState("overview");

  return (
    <div className={s.page}>
      <aside className={s.nav}>
        <p className={s.navTitle}>User guide</p>
        {SECTIONS.map(sec => (
          <a key={sec.id} href={`#${sec.id}`}
            className={active === sec.id ? s.navItemActive : s.navItem}
            onClick={() => setActive(sec.id)}>
            {sec.label}
          </a>
        ))}
      </aside>

      <article className={s.content}>

        <section id="overview" className={s.section}>
          <h1 className={s.h1}>Data Connector Platform</h1>
          <p className={s.pLead}>A bridge between your source databases and a unified editing interface. Connect to PostgreSQL, MySQL, MongoDB, or ClickHouse — extract data in batches, edit it in-browser, then export a versioned CSV or JSON file with one click.</p>
          <div className={s.flowStrip}>
            {["Connect", "→", "Extract", "→", "Edit", "→", "Export"].map((step, i) => (
              <span key={i} className={step === "→" ? s.flowArrow : s.flowStep}>{step}</span>
            ))}
          </div>
        </section>

        <hr className={s.divider} />

        <section id="connections" className={s.section}>
          <h2 className={s.h2}>Connections</h2>
          <p className={s.p}>A connection stores the credentials needed to reach an external database. Credentials are saved encrypted — your password is never returned by the API after saving.</p>
          <div className={s.steps}>
            {[
              ["Open Connections and click'New Connection'", "Choose your database type from the four options: PostgreSQL, MySQL, MongoDB, or ClickHouse."],
              ["Fill in the credential fields", <>SQL databases need <code className={s.code}>host</code>, <code className={s.code}>port</code>, <code className={s.code}>user</code>, <code className={s.code}>password</code>, and <code className={s.code}>database</code>. MongoDB only needs a <code className={s.code}>uri</code>.</>],
              ["Click'Test Connection' before saving", "The platform pings the database with a lightweight query. The Save button only activates once the test returns Healthy."],
            ].map(([title, body], i) => (
              <div key={i} className={s.step}>
                <span className={s.stepNum}>{i + 1}</span>
                <div><p className={s.stepTitle}>{title}</p><p className={s.p}>{body}</p></div>
              </div>
            ))}
          </div>
          <div className={s.calloutInfo}>
            <span className={s.calloutLabelInfo}>Status indicators</span>
            A green dot means the last heartbeat passed. An offline dot means the last check failed — use the ↺ Retest button on the card to re-check without editing credentials.
          </div>
        </section>

        <hr className={s.divider} />

        <section id="extract" className={s.section}>
          <h2 className={s.h2}>Extracting data</h2>
          <p className={s.p}>Extractions run as background jobs. The API returns a <code className={s.code}>job_id</code> immediately and the UI polls for updates every 2 seconds.</p>
          <div className={s.steps}>
            {[
              ["Select a source connection", "The query placeholder updates automatically to match the database type."],
              ["Write your query", <>For SQL sources, write any <code className={s.code}>SELECT</code> statement. For MongoDB, use <code className={s.code}>collection|{"{filter}"}</code>.</>],
              ["Set batch size and run", "Drag the slider or type a number (max 10,000 rows). Click 'Run Extraction' — the progress bar tracks the job in real time."],
            ].map(([title, body], i) => (
              <div key={i} className={s.step}>
                <span className={s.stepNum}>{i + 1}</span>
                <div><p className={s.stepTitle}>{title}</p><p className={s.p}>{body}</p></div>
              </div>
            ))}
          </div>
          <div className={s.calloutWarn}>
            <span className={s.calloutLabelWarn}>MongoDB query format</span>
            Nested documents are automatically flattened into dot-notation columns. Arrays of strings are joined as comma-separated values.
          </div>
        </section>

        <hr className={s.divider} />

        <section id="grid" className={s.section}>
          <h2 className={s.h2}>Editing the grid</h2>
          <p className={s.p}>Once extraction completes, all rows load into the editable grid. Changes are tracked locally — nothing is sent to the server until you click Submit.</p>
          <div className={s.kbdGrid}>
            {[
              ["Double-click", "Edit a cell inline"],
              ["Enter",        "Confirm edit"],
              ["Escape",       "Cancel edit"],
              ["Click ✕",      "Mark row for deletion"],
              ["Click ↩",      "Unmark deletion"],
            ].map(([key, label]) => (
              <div key={key} className={s.kbdRow}>
                <kbd className={s.kbd}>{key}</kbd>
                <span className={s.kbdLabel}>{label}</span>
              </div>
            ))}
          </div>
          <div className={s.calloutInfo}>
            <span className={s.calloutLabelInfo}>Dirty state</span>
            Edited rows are highlighted in blue. The toolbar shows a count of edited rows. Clicking "Reset" reverts all local changes.
          </div>
          <div className={s.calloutWarn}>
            <span className={s.calloutLabelWarn}>Required fields</span>
            Leaving a non-nullable field empty shows a red error below the cell and keeps Submit disabled.
          </div>
        </section>

        <hr className={s.divider} />

        <section id="submit" className={s.section}>
          <h2 className={s.h2}>Submitting & exporting</h2>
          <p className={s.p}>Clicking Submit triggers a two-phase atomic write — both the internal database record and the export file are created together. If either fails, neither is saved.</p>
          <div className={s.steps}>
            {[
              ["Choose export format", "Select JSON or CSV from the toolbar dropdown before submitting. JSON includes a metadata header; CSV includes the same as commented lines."],
              ["Click 'Submit'", "The modified rows are validated, written to the platform database, and an export file is generated with a unique UUID filename and SHA-256 checksum."],
              ["View your file", "A 'View file →' link appears in the panel after a successful submit. You can also find the file on the Files page."],
            ].map(([title, body], i) => (
              <div key={i} className={s.step}>
                <span className={s.stepNum}>{i + 1}</span>
                <div><p className={s.stepTitle}>{title}</p><p className={s.p}>{body}</p></div>
              </div>
            ))}
          </div>
          <div className={s.calloutError}>
            <span className={s.calloutLabelError}>Row errors</span>
            If the server rejects specific rows, those rows are highlighted in red with the error shown inline. Fix the values and resubmit.
          </div>
        </section>

        <hr className={s.divider} />

        <section id="files" className={s.section}>
          <h2 className={s.h2}>File access</h2>
          <p className={s.p}>The Files page lists every export you have access to — files you created, plus any files shared with you.</p>
          <div className={s.steps}>
            {[
              ["Download a file", "Click '↓ Download' next to any file. The server checks your permission before streaming — the file URL is never publicly accessible."],
              ["Share a file", <>File owners can grant Viewer or Downloader access via <code className={s.code}>POST /api/files/{"{id}"}/share/</code>.</>],
            ].map(([title, body], i) => (
              <div key={i} className={s.step}>
                <span className={s.stepNum}>{i + 1}</span>
                <div><p className={s.stepTitle}>{title}</p><p className={s.p}>{body}</p></div>
              </div>
            ))}
          </div>
          <div className={s.calloutInfo}>
            <span className={s.calloutLabelInfo}>Integrity check</span>
            Every file has a SHA-256 checksum. Verify with <code className={s.code}>sha256sum filename.json</code> and compare with the checksum on the Files page.
          </div>
        </section>

        <hr className={s.divider} />

        <section id="rbac" className={s.section}>
          <h2 className={s.h2}>Roles & permissions</h2>
          <p className={s.p}>The platform has two roles assigned at registration: User and Admin.</p>
          <div className={s.roleTable}>
            <div className={s.roleHeader}><span>Action</span><span>User</span><span>Admin</span></div>
            {[
              ["Create connections",          "Own only", "All"],
              ["Run extractions",             "Own only", "All"],
              ["Submit & export",             "Own only", "All"],
              ["Download own files",          "✓",        "✓"],
              ["Download other users' files", "✕",        "✓"],
              ["View all connections",        "✕",        "✓"],
              ["View system audit logs",      "✕",        "✓"],
            ].map(([action, user, admin], i) => (
              <div key={i} className={s.roleRow}>
                <span>{action}</span>
                <span className={user === "✕" ? s.no : s.yes}>{user}</span>
                <span className={s.yes}>{admin}</span>
              </div>
            ))}
          </div>
        </section>

        <hr className={s.divider} />

        <section id="limits" className={s.section}>
          <h2 className={s.h2}>Limits & tips</h2>
          <div className={s.limitsGrid}>
            {[
              ["10,000", "Max rows per extraction"],
              ["100 MB", "Max payload size"],
              ["60 s",   "Extraction timeout"],
              ["3×",     "Auto-retry on failure"],
            ].map(([num, label]) => (
              <div key={label} className={s.limitCard}>
                <span className={s.limitNum}>{num}</span>
                <span className={s.limitLabel}>{label}</span>
              </div>
            ))}
          </div>
          <h3 className={s.h3}>Tips</h3>
          <ul className={s.tipsList}>
            {[
              <>Add a <code className={s.code}>WHERE</code> clause to narrow extractions — smaller batches are faster and easier to review.</>,
              "MongoDB arrays of objects become indexed columns. Keep documents shallow for cleaner grids.",
              "If a job shows FAILED, check the connection health first — the source may have gone offline.",
              "Use JSON format for structured downstream processing; CSV for spreadsheet imports.",
              "The checksum on each file lets you detect if a file was tampered with after export.",
            ].map((tip, i) => <li key={i} className={s.tipsItem}>{tip}</li>)}
          </ul>
        </section>

      </article>
    </div>
  );
}