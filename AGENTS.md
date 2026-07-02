## Design System Rules

This project uses shadcn/ui with a custom preset.

The preset is the source of truth.

Do not:
- invent colors
- add new shadows
- add new border radii
- replace tokens with Tailwind literals
- redesign existing components

When styling:
1. Check existing components.
2. Reuse variants.
3. Use CSS variables.
4. Follow existing patterns.

use /test folder for testing files

A component that matches the preset is better than a visually "improved" component.