# Decisions Log

Owner: `Main Thread`
Last updated: `2026-05-17`

Use for significant decisions only. Keep entries short and explicit.

## Entry Template
### DEC-<id>: <decision title>
- Date: `YYYY-MM-DD`
- Status: Proposed | Accepted | Superseded
- Context: <why this decision is needed>
- Decision: <what was chosen>
- Consequences: <tradeoffs and impacts>
- Related tasks: <task IDs>
- Supersedes: <decision ID or N/A>

---

### DEC-000: Keep Lightweight ADR Entries
- Date: `2026-05-17`
- Status: Accepted
- Context: The repository needs durable cross-thread decision records without heavy ceremony.
- Decision: Adopt lightweight ADR-style entries in this file.
- Consequences: Important project choices stay visible without creating a separate ADR system.
- Related tasks: T-001
- Supersedes: N/A

---

### DEC-001: Use TypeScript Across First-Party Radebe Tooling
- Date: `2026-05-17`
- Status: Accepted
- Context: The project needs one implementation language that can power shared runtime logic, CLI tooling, and browser-based authoring.
- Decision: Build the first-party Radebe toolchain in TypeScript.
- Consequences: `radebe-core`, `radebe-cli`, and `radebe-web` can share code directly; Unity integration will consume the CLI rather than a separate C# port.
- Related tasks: T-001, T-002
- Supersedes: N/A

---

### DEC-002: Organize the Repo as a Multi-Package Workspace
- Date: `2026-05-17`
- Status: Accepted
- Context: The toolchain has distinct responsibilities across core runtime, CLI usage, web authoring, Unity integration, and automation.
- Decision: Structure the repository around `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts`.
- Consequences: Package boundaries are explicit early, and implementation can proceed without mixing runtime, UI, and bridge concerns.
- Related tasks: T-001, T-004, T-005
- Supersedes: N/A

---

### DEC-003: Unity Integration Goes Through the CLI
- Date: `2026-05-17`
- Status: Accepted
- Context: Unity needs a stable integration surface while the TypeScript core remains the canonical implementation.
- Decision: `radebe-unity` will use `radebe-cli` as its bridge to the shared toolchain.
- Consequences: Packaging the CLI as a standalone executable becomes an important delivery concern for M0/M1 planning.
- Related tasks: T-003, T-005
- Supersedes: N/A
