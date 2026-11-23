# Summary

-

# Feature Contract

- Layer:
- Default or optional:
- Public extension point used:
- Feature flag needed:
- Slash command impact:
- Custom nodes involved:
- Files added per feature folder:
- Tests added:
- Docs updated:
- AGENTS.md update needed:

# Architecture Checklist

- [ ] The change starts in the layer that owns the concern (`editor.tsx`, `core/`, `ui/`, `plugins/<feature>/`, or `core/nodes/<feature>/`)
- [ ] I used an existing public extension point (`extraFeatures`, `features`, `chrome`, `slots`, `pluginSlots`, `extraNodes`) before introducing a new prop or branch
- [ ] If the feature is an optional content capability, it exports an `ExtraEditorFeature` descriptor (with `slashCommands` if applicable); if it is a core toggle, it is wired through `EditorFeatureFlags`
- [ ] If slash commands depend on this capability, they flow through `ExtraEditorFeature.slashCommands` and `EditorCommandsContext`
- [ ] `plugin.tsx` remains orchestration-focused; helper UI, menus, dialogs, selection math, and actions live in neighboring feature files
- [ ] Editable and read-only modes were considered
- [ ] HTML/Markdown copy-paste behavior was considered if relevant
- [ ] Docs were updated if the public API or architecture changed

# Validation

- [ ] `bun run test`
- [ ] `bun run check`
- [ ] `bun run build` if the change affects shipped editor behavior, docs, or registry output

# Notes

-
