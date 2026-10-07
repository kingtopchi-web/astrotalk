---
name: AuraExpert
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4f4632'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#827660'
  outline-variant: '#d4c5ac'
  surface-tint: '#795900'
  primary: '#795900'
  on-primary: '#ffffff'
  primary-container: '#f5b800'
  on-primary-container: '#664b00'
  inverse-primary: '#fabd0d'
  secondary: '#5e27e6'
  on-secondary: '#ffffff'
  secondary-container: '#774aff'
  on-secondary-container: '#f8f2ff'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#48d99e'
  on-tertiary-container: '#005b3d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf9f'
  primary-fixed-dim: '#fabd0d'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#e7deff'
  secondary-fixed-dim: '#ccbeff'
  on-secondary-fixed: '#1f0060'
  on-secondary-fixed-variant: '#4d00d2'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The platform delivers an elite on-demand expert consultation marketplace that merges high-trust professionalism with welcoming warmth. The target audience comprises ambitious professionals, seekers of specialized counsel (executive, legal, wellness, tech), and certified advisors looking for seamless client engagement.

The aesthetic blends **Modern Tactile Warmth** and **Contemporary Editorial Fluidity**. Instead of sterile clinical blues or generic corporate palettes, the UI operates on luminous warm ivory foundations layered with radiant golden amber vitality and royal purple intellectual authority. The interaction model feels app-native, responsive, and immediate—prioritizing friction-free discovery, instant session initialization, and lucid credibility signals.

## Colors
The color palette establishes immediate status, visual comfort, and rapid cognitive scanning:

- **Primary Accent (`#F5B800` - Radiant Amber):** Communicates value, optimism, and prestige. Employed for high-intent conversion points, dynamic rating indicators, and active session CTAs.
- **Secondary Accent (`#6D3DF5` - Royal Amethyst):** Represents intellect, depth, and curated expertise. Applied to top-tier verified credentials, consultation channel iconography (video/audio indicators), and VIP expert highlights.
- **Tertiary Accent (`#10B981` - Vital Emerald):** Reserved strictly for real-time presence indicators (online badges, instant availability pulses, and successful wallet transactions).
- **Neutral Foundation (`#171717` - Deep Obsidian Slate):** Provides sharp typographical legibility with softened contrast against light canvases.
- **Subordinate Neutrals & Canvas:**
  - Base Background: Warm Ivory (`#FFFDF8`)
  - Elevated Container / Card Fill: Pristine Pure White (`#FFFFFF`)
  - Subdued Text / Slate Borders: Elegant Slate (`#6B7280`) and Warm Border Hairlines (`#F3EFE6`)

## Typography
The system employs a dual-typeface structure designed for clarity and engagement. **Plus Jakarta Sans** introduces warmth, approachable geometric forms, and high-impact structural hierarchy in display headers, expert names, and micro-metrics. **Inter** handles narrative descriptions, service offerings, and consultation notes, maximizing legibility across high-density mobile viewports.

Numeric values (such as per-minute rates and wallet balances) pair with tabular figure settings (`tnum`) inside Plus Jakarta Sans to prevent layout jitter during live updates.

## Layout & Spacing
A fluid 4-column layout is enforced for viewports under 640px, transitioning to an 8-column layout on tablets (641px–1024px) and a structured 12-column layout on desktop screens (>1024px).

Content containers maintain maximum widths of 1280px on desktop with auto margins. Mobile devices use edge padding of 16px (`margin`), ensuring content does not touch device bezels. The vertical rhythm conforms to a strict 4px/8px incremental grid.

On mobile viewports, the bottom navigation bar occupies a fixed 64px clearance zone with safe-area padding at `env(safe-area-inset-bottom)`. The main content view includes trailing bottom padding (`space-xl` × 3) to prevent the navigation bar or fixed consultation CTA triggers from occluding scrollable content.

## Elevation & Depth
Depth is produced via subtle, warm-tinted ambient shadows rather than harsh neutral blacks. This approach preserves the soft ivory environment while giving cards distinct visual layers.

- **Level 0 (Flat):** Base canvas (`#FFFDF8`), no shadow.
- **Level 1 (Card & Content Blocks):** Pure white background (`#FFFFFF`), `0px 2px 8px -2px rgba(109, 61, 245, 0.04), 0px 4px 16px -4px rgba(23, 23, 23, 0.06)`, bounded by a 1px border of `#F3EFE6`.
- **Level 2 (Active/Hovered Card, Floating Filters):** `0px 8px 24px -4px rgba(109, 61, 245, 0.08), 0px 4px 12px -2px rgba(245, 184, 0, 0.08)`.
- **Level 3 (Modals, Bottom Action Drawers, Sticky CTAs):** `0px 16px 36px -6px rgba(23, 23, 23, 0.12), 0px 8px 16px -4px rgba(109, 61, 245, 0.06)`.
- **Glass Floating Bars:** Used for the bottom navigation bar and sticky header: `rgba(255, 253, 248, 0.85)` surface backing with `backdrop-filter: blur(16px)` and a subtle `rgba(243, 239, 230, 0.8)` baseline stroke.

## Shapes
The visual identity uses friendly yet polished geometry with consistent curve scales:

- Base consultation cards, marketplace item cards, and content pods use 18px to 24px radius values (`rounded-xl` to custom `rounded-[20px]`).
- Interactive buttons, form inputs, and search modules use 12px to 14px radii for balanced touch targets.
- High-conversion micro-badges (ratings, status badges, price tags, channel toggles) use fully rounded pill silhouettes (`rounded-full`) to differentiate metadata from structural content containers.

## Components

### 1. Expert Profile & Marketplace Cards
- **Structure:** Encased in pure white (`#FFFFFF`) with a 20px border radius and 1px `#F3EFE6` border.
- **Header:** Features a 64px rounded avatar with an overlaid absolute-positioned tertiary status dot (12px Emerald, with a 2px white ring indicating 'Online').
- **Name & Meta:** Expert display name in `headline-sm`, subtitle/category in `body-sm` (`#6B7280`), and a secondary verified checkmark in `#6D3DF5`.
- **Metrics Bar:** Pill-badge display featuring a warm golden star (`#F5B800`), aggregate score (e.g., "4.98"), total session count, and bold per-minute pricing (e.g., "$3.20/min") highlighted in `#171717`.
- **Quick Action Dock:** Three unified action buttons (Chat, Audio, Video) split horizontally or grouped, highlighting channel availability with amethyst-tinted icon fills.

### 2. Buttons & Consultation CTAs
- **Primary Action (Book/Connect Now):** Solid Golden Amber (`#F5B800`) background, obsidian text (`#171717`), `font-weight: 700`, with subtle press down scaling (`scale-98`).
- **Secondary Action (View Bio / Schedule):** Royal Amethyst tint (`rgba(109, 61, 245, 0.08)`) with vibrant `#6D3DF5` text, providing visual contrast without competing with main conversion buttons.
- **Destructive/Emergency Disconnect:** Subtle soft crimson fill with deep ruby label text.

### 3. Micro-Badges & Pricing Chips
- **Verified Badge:** Royal Purple (`#6D3DF5`) badge featuring an integrated white check icon and `label-sm` typographic styling.
- **Availability Beacon:** Emerald green (`#10B981`) text on translucent mint fill (`rgba(16, 185, 129, 0.12)`) featuring a subtle pulsing outer ring for active experts.
- **Wallet Recharge Chip:** Displayed prominently in the top app header; features a soft gold capsule (`rgba(245, 184, 0, 0.15)`), dynamic token balance text, and a mini `+` quick-recharge trigger.

### 4. Input Fields & Search Experience
- Enclosed with a 12px radius, `#FFFFFF` interior, and an understated `#E5E0D5` stroke.
- Focus state replaces the boundary with a 2px `#6D3DF5` ring accompanied by a soft amethyst glow (`0 0 0 4px rgba(109, 61, 245, 0.1)`).
- Search input embeds a floating category pill carousel immediately below the search threshold for direct one-tap specialty filtering.

### 5. Mobile Bottom Navigation
- Fixed frosted acrylic strip (`rgba(255, 253, 248, 0.9)`) with 4 principal nodes: Discover, Sessions, Messages, and Profile/Wallet.
- Active states are marked with an amethyst accent glow dot and high-contrast `#171717` glyphs.