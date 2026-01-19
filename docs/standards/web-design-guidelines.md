# Vercel Web Interface Guidelines - Quick Reference

## Focus States

- Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
- Never `outline-none` / `outline: none` without focus replacement
- Use `:focus-visible` over `:focus`
- Group focus with `:focus-within`

## Forms

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault`)
- Labels clickable (`htmlFor` or wrapping control)
- Disable spellcheck on emails, codes, usernames
- Checkboxes/radios: label + control share single hit target
- Submit button states: enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- `autocomplete="off"` on non-auth fields
- Warn before navigation with unsaved changes

## Animation

- Honor `prefers-reduced-motion`
- Animate `transform`/`opacity` only
- Never `transition: all`
- SVG: transforms on `g` wrapper
- Animations interruptible

## Typography

- `…` not `...`
- Curly quotes `“` `”`
- Non-breaking spaces: `10 MB`, `⌘ K`
- Loading states end with `…`
- `font-variant-numeric: tabular-nums` for numbers
- `text-wrap: balance` on headings

## Content & Copy

- Active voice
- Title Case for headings/buttons
- Numerals for counts
- Specific button labels ("Save API Key" not "Continue")
- Error messages include fix/next step
- Second person; avoid first person
- `&` over "and" where space-constrained

## Performance

- Large lists (>50 items): virtualize
- No layout reads in render
- Batch DOM reads/writes
- Prefer uncontrolled inputs; controlled must be cheap
- Add `preconnect` for CDN/asset domains

## Navigation & State

- URL reflects state (filters, tabs, pagination)
- Links use `a`/`Link`
- Deep-link all stateful UI (URL sync)
- Destructive actions need confirmation

## Touch & Interaction

- `touch-action: manipulation`
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals
- `autoFocus` sparingly—desktop only, single primary input

## Anti-patterns (FLAG THESE)

- `user-scalable=no`
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without focus-visible replacement
- Inline `onClick` navigation without `a`
- `div` or `span` with click handlers (should be `button`)
- Images without dimensions
- Form inputs without labels
- Icon buttons without `aria-label`
- Hardcoded date/number formats
- `autoFocus` without clear justification
