# NoteAI Design System — Final

## Philosophy
Minimal. Professional. Apple, Vercel-inspired. Light theme. One accent color. Whitespace-driven.

---

## Color Palette

| Role | Value | Use |
|------|-------|-----|
| Background | #ffffff | Page bg |
| Surface | #f5f5f5 | Cards, panels |
| Surface Light | #fafafa | Hover states |
| Text Primary | #1a1a1a | Body text, headings |
| Text Secondary | #666666 | Supporting text |
| Text Muted | #999999 | Labels, hints |
| Border | #e0e0e0 | Dividers (0.5px) |
| Accent | #0070f3 | Interactive, focus, active |
| Success | #10b981 | Positive states |
| Error | #ef4444 | Error states |

---

## Typography

**Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (system fonts)

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| H1 | 32px | 700 | Page title |
| H2 | 24px | 600 | Section heading |
| H3 | 18px | 600 | Card heading |
| Subheading | 15px | 500 | List items, labels |
| Body | 14px | 400 | Main text |
| Secondary | 13px | 400 | Supporting text |
| Label | 12px | 500 | Labels, captions |
| Tiny | 11px | 500 | Timestamps, hints |

---

## Spacing

- **Padding (sections):** 24px
- **Padding (cards):** 16px
- **Gap (elements):** 12px
- **Gap (inline):** 8px
- **Border radius:** 6px (inputs, cards), 8px (panels)

---

## Components

### Button (Primary)
- Background: #0070f3
- Text: white
- Padding: 10px 16px
- Border radius: 6px
- Font: 14px, 500 weight
- Hover: #0051cc (darker blue)
- Active: scale 0.98

### Button (Secondary)
- Background: #f5f5f5
- Text: #1a1a1a
- Border: 0.5px #e0e0e0
- Padding: 10px 16px
- Border radius: 6px
- Hover: #e0e0e0 background

### Input
- Background: #ffffff
- Border: 0.5px #e0e0e0
- Padding: 12px
- Border radius: 6px
- Font: 14px
- Focus: border #0070f3, shadow none
- Placeholder: #999999

### Card
- Background: #ffffff
- Border: 0.5px #e0e0e0
- Padding: 16px
- Border radius: 6px
- Hover: shadow none (flat style)

### Search Bar
- Background: #f5f5f5
- Border: 0.5px #e0e0e0
- Padding: 12px
- Border radius: 6px
- Icon: search, gray
- Placeholder: "Search meetings..."

### Meeting List Item
- Background: white
- Border: 0.5px #e0e0e0
- Padding: 16px
- Margin bottom: 12px
- Border radius: 6px
- Hover: background #f5f5f5
- Active: border #0070f3 (2px)

### Meeting Detail Layout
- Left: List of meetings (320px wide)
- Right: Detail view (remaining width)
- Transcript area: Full width minus sidebar
- Tabs: Transcript | Summary | Action Items
- Tab indicator: 2px blue underline

### Transcript Line
- Speaker avatar: 32px circle, initials
- Speaker name: 15px, 500 weight, black
- Message text: 14px, 400 weight, #666
- Timestamp: 11px, 500 weight, #999
- Separator: 0.5px border between lines

---

## Layout Patterns

### Page Header
- H1: 32px, 700 weight
- Subtext: 13px, #666
- Search bar below

### Sidebar Navigation
- Width: 200px
- Background: #f5f5f5
- Border: 0.5px right #e0e0e0
- Item padding: 12px 20px
- Active item: text #0070f3, border-left 2px blue

### Tab Navigation
- Font: 14px, 500 weight
- Active tab: text #0070f3, underline 2px blue
- Inactive tab: text #999999
- Gap: 24px
- Border bottom: 0.5px #e0e0e0

### Card Grid
- Max width: 1140px
- Column layout: repeat(auto-fit, minmax(300px, 1fr))
- Gap: 16px
- Responsive: 1 col @mobile, 2 @tablet, 3 @desktop

---

## States

### Hover
- Background → slight darker (white → #f5f5f5)
- No shadow
- Cursor: pointer

### Focus
- Border: 2px #0070f3
- Shadow: none
- Outline: none

### Active
- Background: #f5f5f5
- Border left: 2px #0070f3

### Disabled
- Opacity: 0.5
- Cursor: not-allowed

### Loading
- Opacity: 0.6
- Animation: none (no spinners)

### Empty State
- Center text: "No meetings yet"
- Color: #999999
- Font: 14px

---

## Interactions

- **Click feedback:** Instant (no delay)
- **Hover:** Color change only
- **Animations:** None (or fade in/out at 200ms max)
- **Transitions:** `all 200ms ease-out`

---

## Responsive Rules

### Mobile (< 768px)
- Single column layout
- Sidebar collapses (hamburger menu)
- Font sizes: -2px from desktop
- Padding: 16px (instead of 24px)

### Tablet (768px - 1024px)
- Sidebar visible, narrower
- Main content adjusted
- Grid: 2 columns

### Desktop (> 1024px)
- Full layout as specified
- Grid: 3 columns
- Full spacing

---

## Implementation Notes

**Tailwind classes to use:**
- `bg-white`, `bg-gray-50`, `bg-gray-100`
- `text-gray-900`, `text-gray-600`, `text-gray-400`
- `border-gray-200`, `border-2`, `border-blue-500`
- `rounded-md`, `rounded-lg`
- `px-4`, `py-3`, `gap-3`
- `hover:bg-gray-100`, `hover:border-blue-500`
- `focus:border-blue-500`, `focus:outline-none`

**Shadcn/ui components:**
- Button
- Input
- Card
- Tabs
- Dialog
- Select

---

## Accessibility
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- All text readable (no sizes < 12px for body)
- Focus states visible (blue border)
- Semantic HTML (heading hierarchy)