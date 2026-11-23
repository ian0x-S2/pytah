# Feature RFC Template

Use this before building a new editor feature, whether the author is a human contributor or an AI agent.

## Problem

- What user or product need does this solve?

## Ownership

- Layer: `editor.tsx` / `core/` / `ui/` / `plugins/<feature>/` / `core/nodes/<feature>/`
- Why this layer owns the change:

## Product Shape

- Is this default core behavior or an optional content feature (`extraFeatures`)?
- If optional content feature, what `ExtraEditorFeature` descriptor (`id`, `plugin`, `nodes`, `transformers`, `slashCommands`) does it export?
- If core toggle, which `EditorFeatureFlags` key controls it?
- Does it need a `chrome`, `slots`, `pluginSlots`, or `extraNodes` entry instead?

## Feature Structure

- Plugin folder:
- Node folder:
- `plugin.tsx` responsibilities:
- Files expected to be extracted from `plugin.tsx`:

## Command and Composition Impact

- Does slash command need a new command or gating update?
- Does the ready-made `Editor` API change?
- Do docs/examples need updates?

## Validation

- Critical tests to add:
- Manual behavior to verify:
- Read-only impact:
- HTML/Markdown/copy-paste impact:

## Acceptance Criteria

- The feature can be explained through an existing public extension point or a justified new one
- The change does not require consumers to patch internals for normal customization
- The implementation follows feature-first folder ownership
