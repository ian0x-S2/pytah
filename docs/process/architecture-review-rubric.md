# Architecture Review Rubric

Use this during review to decide whether a feature follows the editor architecture contract.

## 1. Ownership

- Does the code live in the layer that owns the concern?
- Did the author avoid reaching into `ui/content.tsx` or `core/config.ts` when a feature-local implementation would work?

## 2. Public Contract

- Is the change modeled through `features`, `chrome`, `slots`, `pluginSlots`, or `extraNodes` before introducing a new prop or branch?
- If the capability is optional, is it exposed through `EditorFeatureFlags`?

## 3. Feature-First Structure

- Does the feature live under `plugins/<feature>/`?
- If the feature owns custom nodes, are they aligned under `core/nodes/<feature>/`?
- Is `plugin.tsx` still an orchestration entrypoint rather than a catch-all file?

## 4. Behavioral Consistency

- If slash commands depend on the capability, does the command list stay in sync with the enabled features?
- Are editable and read-only modes both considered?
- Is HTML/Markdown/copy-paste behavior preserved where relevant?

## 5. Verification

- Were focused tests added for the critical behavior or public contract?
- Were docs/examples updated when the API or architecture changed?
- If the mental model changed, was `AGENTS.md` updated?

## Review Decision

- Approve only if the feature is structurally owned, publicly composable, and verified.
- Request changes if the implementation introduces hidden coupling, one-off flags, unsynced slash commands, or a monolithic `plugin.tsx`.
