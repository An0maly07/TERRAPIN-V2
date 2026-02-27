# TERRAPIN-V2 — UI Fix & Enhancement Prompts

## Repository Overview

| Detail | Value |
|--------|-------|
| **Stack** | Next.js (App Router), TypeScript (91%), CSS (8.2%), shadcn/ui |
| **Styling** | Tailwind CSS + PostCSS |
| **Font** | Geist (via `next/font`) |
| **Repo** | github.com/An0maly07/TERRAPIN-V2 |

> **How to use this document:** Each section below contains a **Problem diagnosis** and a ready-to-paste **Claude prompt** you can feed into Claude (or any AI coding assistant) to get the fix implemented. Copy the prompt, paste it into your AI tool with the relevant file(s), and apply the output.

---

## 1. LAYOUT & STRUCTURE FIXES

### 1.1 — Responsive Layout & Container System

**Problem:** Next.js starter projects often lack a proper responsive container system, leading to content that either stretches full-width on large screens or breaks on mobile.

**Prompt:**
```
Review all page and layout files in src/app/. Fix the following layout issues:

1. Add a proper responsive container wrapper to the root layout (layout.tsx) using Tailwind: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
2. Ensure all pages use consistent padding and max-width constraints
3. Add a sticky/fixed header with proper z-index layering (z-50) and backdrop-blur-md for a glassmorphism effect
4. Implement a proper footer that sticks to the bottom on short pages (use min-h-screen flex flex-col, with main as flex-1)
5. Add proper spacing between sections using consistent gap/space-y utilities (space-y-8 or gap-8 minimum)
6. Ensure the layout works across breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)

Use Tailwind CSS only. Preserve existing shadcn/ui components.
```

### 1.2 — Navigation / Sidebar Layout

**Prompt:**
```
Create or improve the navigation component for TERRAPIN-V2:

1. Build a responsive Navbar component at src/components/Navbar.tsx:
   - Desktop: horizontal nav bar with logo left, links center, CTA right
   - Mobile: hamburger menu with animated slide-in drawer (use Framer Motion)
   - Add active link highlighting using usePathname() from next/navigation
   - Apply backdrop-blur-lg bg-background/80 for a frosted glass effect
   - Smooth height transition when scrolling (shrink header on scroll using a useScrollPosition hook)

2. If the app has a sidebar, make it collapsible:
   - Desktop: persistent sidebar with toggle (width transition from w-64 to w-16)
   - Mobile: overlay drawer with dark backdrop
   - Animate with CSS transitions (transition-all duration-300 ease-in-out)

Use shadcn/ui Sheet component for mobile drawer. Use Tailwind for all styling.
```

### 1.3 — Grid & Card Layout System

**Prompt:**
```
Audit all grid/card layouts across the application and fix:

1. Replace any raw flexbox hacks with proper CSS Grid using Tailwind:
   - `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
2. Ensure all cards have consistent dimensions:
   - Equal height rows using `grid` (not flexbox)
   - Consistent internal padding (p-6)
   - Consistent border-radius (rounded-xl)
   - Subtle border (border border-border/50)
3. Add proper empty states for any lists/grids that could be empty
4. Fix any content overflow issues — add `overflow-hidden` on cards and `truncate` or `line-clamp-2` on text that could overflow

Output the fixed components with before/after comments.
```

---

## 2. ANIMATIONS & EFFECTS

### 2.1 — Page Transition Animations

**Prompt:**
```
Add smooth page transition animations to TERRAPIN-V2 using Framer Motion:

1. Install framer-motion: `npm install framer-motion`

2. Create a PageTransition wrapper component at src/components/PageTransition.tsx:
   ```tsx
   "use client";
   import { motion, AnimatePresence } from "framer-motion";
   
   const variants = {
     hidden: { opacity: 0, y: 20 },
     enter: { opacity: 1, y: 0 },
     exit: { opacity: 0, y: -20 },
   };
   
   export default function PageTransition({ children }) {
     return (
       <motion.div
         variants={variants}
         initial="hidden"
         animate="enter"
         exit="exit"
         transition={{ type: "spring", stiffness: 260, damping: 20 }}
       >
         {children}
       </motion.div>
     );
   }
   ```

3. Wrap each page's content with <PageTransition>
4. Add AnimatePresence in the root layout to handle exit animations
5. Ensure the transitions don't cause layout shift (use position: relative on the wrapper)
```

### 2.2 — Scroll-Triggered Animations (Stagger Reveal)

**Prompt:**
```
Add scroll-triggered stagger animations for lists, cards, and content sections:

1. Create a reusable AnimateOnScroll component using Framer Motion's useInView:

   ```tsx
   "use client";
   import { motion, useInView } from "framer-motion";
   import { useRef } from "react";

   export function AnimateOnScroll({ children, delay = 0, className = "" }) {
     const ref = useRef(null);
     const isInView = useInView(ref, { once: true, margin: "-100px" });

     return (
       <motion.div
         ref={ref}
         initial={{ opacity: 0, y: 40 }}
         animate={isInView ? { opacity: 1, y: 0 } : {}}
         transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
         className={className}
       >
         {children}
       </motion.div>
     );
   }
   ```

2. Create a StaggerContainer that auto-staggers children:
   - Each child gets an incremental delay (index * 0.1s)
   - Apply to all card grids and list sections

3. Add parallax scrolling effect to hero/banner sections:
   - Use useScroll + useTransform from Framer Motion
   - Subtle Y translation (translateY: scrollY * 0.3)

Apply these to all major content sections throughout the app.
```

### 2.3 — Micro-interactions & Hover Effects

**Prompt:**
```
Add polished micro-interactions throughout the TERRAPIN-V2 UI:

1. **Buttons:**
   - Add scale-on-hover: `hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150`
   - Add subtle shadow lift on hover: `hover:shadow-lg transition-shadow duration-200`
   - Primary CTA buttons: add a shimmer/gradient animation on hover

2. **Cards:**
   - Hover lift effect: `hover:-translate-y-1 hover:shadow-xl transition-all duration-300`
   - Add a subtle border-glow on hover using box-shadow with theme color
   - Cursor pointer on clickable cards

3. **Links/Nav items:**
   - Underline animation: animated width from 0 to 100% using `after:` pseudo-element
   - Active state: colored indicator dot or bottom border

4. **Inputs/Form fields:**
   - Focus ring animation: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200`
   - Label float animation on focus (if using floating labels)

5. **Icons:**
   - Rotate or bounce on hover where appropriate
   - Loading states: pulse or spin animation

6. **Tooltips:**
   - Fade + slight scale from 0.95 to 1 on appear
   - Use shadcn/ui Tooltip with custom animation duration

Use only Tailwind utilities and CSS transitions. No JS-based animation for micro-interactions.
```

### 2.4 — Loading States & Skeleton UI

**Prompt:**
```
Add proper loading states and skeleton UIs throughout the application:

1. Create a Skeleton component set at src/components/ui/skeleton.tsx:
   - SkeletonCard: mimics card layout with animated pulse
   - SkeletonText: single line with rounded ends, varying widths
   - SkeletonAvatar: circular skeleton
   - SkeletonTable: table row placeholder

2. Use Tailwind's `animate-pulse` with proper `bg-muted` coloring

3. Add Next.js loading.tsx files for each route that needs it:
   - Each loading.tsx should render skeletons matching the actual page layout
   - This gives instant feedback during route transitions

4. Add a global progress bar at the top of the page for route changes:
   - Thin bar (h-0.5) with primary color
   - Animate width from 0% to ~90% on start, then complete to 100% on finish
   - Use Next.js Router events or nprogress

5. Button loading states:
   - Replace text with spinner + "Loading..." when submitting
   - Disable button and reduce opacity during loading
   - Use shadcn/ui Button with loading prop pattern

Output all components with full TypeScript types.
```

---

## 3. VISUAL DESIGN & THEMING

### 3.1 — Dark/Light Mode Polish

**Prompt:**
```
Audit and fix the dark/light mode implementation in TERRAPIN-V2:

1. Ensure the theme toggle works smoothly:
   - Use next-themes with system preference detection
   - Add a ThemeToggle component with sun/moon icon animation (rotate + fade transition)
   - Place it in the navbar

2. Fix common dark mode issues:
   - Check all hardcoded colors (any hex values in className) and replace with Tailwind theme tokens (bg-background, text-foreground, etc.)
   - Ensure images/logos have appropriate variants or use `dark:invert` where applicable
   - Fix any contrast issues — all text should meet WCAG AA (4.5:1 ratio minimum)
   - Borders should use `border-border` not hardcoded grays
   - Shadows in dark mode should be more subtle or use colored shadows

3. Add smooth theme transition:
   - Apply `transition-colors duration-300` to the root html/body
   - Prevent flash of unstyled content (FOUC) by using the suppressHydrationWarning pattern with next-themes

4. Ensure shadcn/ui components all respect the theme properly — check all custom overrides.
```

### 3.2 — Typography & Spacing System

**Prompt:**
```
Fix and systematize typography across TERRAPIN-V2:

1. Establish a type scale using the Geist font (already configured via next/font):
   - Display/Hero: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
   - H1: text-3xl sm:text-4xl font-bold tracking-tight
   - H2: text-2xl sm:text-3xl font-semibold
   - H3: text-xl sm:text-2xl font-semibold
   - Body: text-base leading-relaxed
   - Small/Caption: text-sm text-muted-foreground
   - Code: font-mono text-sm

2. Add consistent spacing rhythm:
   - Section spacing: py-16 sm:py-20 lg:py-24
   - Component spacing: space-y-6 or gap-6
   - Tight spacing (within cards): space-y-2 or gap-2

3. Fix any orphaned text styling — search for inline style= attributes and convert to Tailwind

4. Add proper text wrapping:
   - Headlines: `text-balance` (CSS text-wrap: balance)
   - Paragraphs: `max-w-prose` for readability (65ch max-width)
   - Long words: `break-words` where needed
```

### 3.3 — Color System & Gradients

**Prompt:**
```
Enhance the color system and add modern gradient effects:

1. Audit the current color palette in tailwind.config.ts and globals.css:
   - Ensure all HSL CSS variables are properly defined for both light and dark themes
   - Add accent colors if missing (success, warning, info)

2. Add gradient effects for visual flair:
   - Hero section: subtle mesh gradient background using CSS:
     `bg-gradient-to-br from-primary/5 via-background to-secondary/5`
   - Text gradients for headings (where appropriate):
     `bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent`
   - Card hover: gradient border effect using a wrapper div technique
   - CTA buttons: `bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70`

3. Add a subtle animated gradient background for the hero/landing section:
   ```css
   @keyframes gradient-shift {
     0% { background-position: 0% 50%; }
     50% { background-position: 100% 50%; }
     100% { background-position: 0% 50%; }
   }
   .animated-gradient {
     background-size: 200% 200%;
     animation: gradient-shift 8s ease infinite;
   }
   ```

4. Add glow effects where appropriate:
   - Primary buttons: subtle box-shadow glow using primary color with opacity
   - Active/focused elements: ring glow effect
```

---

## 4. COMPONENT-SPECIFIC FIXES

### 4.1 — Forms & Input Components

**Prompt:**
```
Fix and polish all form/input components in the TERRAPIN-V2 application:

1. Ensure all inputs use shadcn/ui Input component with consistent styling
2. Add proper form validation feedback:
   - Error state: red border + error message with fade-in animation
   - Success state: green check icon
   - Character counts where applicable
3. Fix input grouping/spacing:
   - Consistent label positioning (above input, font-medium text-sm mb-1.5)
   - Form field groups with space-y-4
   - Button alignment at bottom-right of forms
4. Add focus management:
   - Auto-focus first field on form mount
   - Tab order is logical
   - Enter key submits where appropriate
5. Mobile optimizations:
   - Full-width inputs on mobile
   - Appropriate input types (email, tel, url) for mobile keyboards
   - Touch-friendly sizing (min-h-[44px] for all interactive elements)
```

### 4.2 — Modal / Dialog Improvements

**Prompt:**
```
Fix and enhance all modals/dialogs in TERRAPIN-V2:

1. Use shadcn/ui Dialog with improved animations:
   - Backdrop: fade in with bg-black/50 backdrop-blur-sm
   - Content: scale from 0.95 + fade + slight Y translate
   - Exit: reverse animation (scale down + fade)

2. Fix accessibility:
   - Trap focus inside modal when open
   - Close on Escape key
   - Close on backdrop click
   - Return focus to trigger element on close
   - Proper aria-labels and role="dialog"

3. Responsive modals:
   - Desktop: centered with max-w-lg
   - Mobile: full-screen sheet sliding up from bottom (use shadcn/ui Sheet for mobile)
   - Add a media query hook to switch between Dialog and Sheet

4. Scrollable content:
   - Fixed header/footer, scrollable body
   - Fade indicators at top/bottom when content is scrollable
```

### 4.3 — Table / Data Display

**Prompt:**
```
If the app displays any tabular data, fix and enhance the table components:

1. Use shadcn/ui Table with these enhancements:
   - Sticky header: `sticky top-0 bg-background z-10`
   - Alternating row colors: `even:bg-muted/50`
   - Row hover: `hover:bg-muted transition-colors`
   - Responsive: horizontal scroll wrapper on mobile with `overflow-x-auto`

2. Add sorting indicators (chevron up/down icons in headers)
3. Add proper empty state with illustration and message
4. Add loading skeleton that matches table structure
5. Mobile alternative: switch to card-based layout below md breakpoint
   - Each row becomes a card with label:value pairs
   - Use a custom hook `useMediaQuery` to toggle between views
```

---

## 5. PERFORMANCE & POLISH

### 5.1 — Image Optimization

**Prompt:**
```
Audit and fix all image usage in TERRAPIN-V2:

1. Replace all <img> tags with Next.js <Image> component:
   - Add proper width/height or fill prop
   - Add loading="lazy" for below-fold images
   - Add priority for hero/above-fold images
   - Use proper sizes prop for responsive images

2. Add image placeholders:
   - Use blur placeholder with blurDataURL for local images
   - Use a skeleton placeholder for dynamic images

3. Optimize static assets in /public:
   - Convert any PNG/JPG to WebP where possible
   - Ensure SVGs are optimized (remove metadata, minify)
   - Add proper favicon set (favicon.ico, apple-touch-icon, etc.)
```

### 5.2 — Accessibility Fixes

**Prompt:**
```
Run an accessibility audit on TERRAPIN-V2 and fix all issues:

1. Semantic HTML:
   - Ensure proper heading hierarchy (h1 → h2 → h3, no skips)
   - Use <main>, <nav>, <header>, <footer>, <section>, <article> properly
   - Add landmark roles where semantic elements aren't sufficient

2. Keyboard navigation:
   - All interactive elements must be focusable and operable via keyboard
   - Add visible focus indicators: `focus-visible:ring-2 focus-visible:ring-ring`
   - Skip-to-content link as first focusable element

3. ARIA attributes:
   - Add aria-label to icon-only buttons
   - Add aria-expanded to toggles/dropdowns
   - Add aria-live="polite" to dynamic content areas (notifications, form errors)

4. Color contrast:
   - Verify all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
   - Don't rely on color alone to convey information

5. Screen reader:
   - Add sr-only text for decorative elements that convey meaning
   - Ensure all images have meaningful alt text (or alt="" for decorative)
```

### 5.3 — Smooth Scroll & Scroll Behavior

**Prompt:**
```
Add polished scroll behaviors to TERRAPIN-V2:

1. Enable smooth scrolling globally:
   ```css
   html { scroll-behavior: smooth; }
   @media (prefers-reduced-motion: reduce) {
     html { scroll-behavior: auto; }
   }
   ```

2. Add a scroll-to-top button:
   - Appears after scrolling down 400px
   - Fixed position bottom-right
   - Fade + scale animation on appear/disappear
   - Smooth scroll to top on click
   - Uses shadcn/ui Button with ArrowUp icon

3. Add scroll progress indicator:
   - Thin bar at the top of the page (h-0.5)
   - Width tracks scroll progress (0% to 100%)
   - Primary color with slight opacity

4. Anchor link scroll offset:
   - Account for fixed header height with scroll-margin-top on target sections
   - `scroll-mt-20` on all section headings
```

---

## 6. GLOBAL QUICK-FIX PROMPT (All-in-One)

Use this prompt to address the most common and impactful issues in one pass:

```
I need you to review and fix the UI of my Next.js + TypeScript + shadcn/ui project (TERRAPIN-V2). Here are the priority fixes:

**Layout:**
- Add proper responsive container (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8) to root layout
- Sticky header with backdrop-blur and proper z-index
- Footer stuck to bottom (min-h-screen flex flex-col pattern)
- Consistent section spacing (py-16 sm:py-20)

**Animations:**
- Add Framer Motion page transitions (fade + slide)
- Scroll-triggered reveal animations for content sections
- Hover effects on cards (lift + shadow) and buttons (scale)
- Loading skeletons for all async content

**Visual Polish:**
- Fix dark mode — no hardcoded colors, all using CSS variables
- Add gradient accents to hero section and primary buttons
- Consistent typography scale using Geist font
- Proper spacing rhythm (space-y-6 for sections, space-y-2 within components)

**Components:**
- Polish all form inputs (validation states, focus rings, touch-friendly sizing)
- Improve modals (proper animations, mobile-friendly, accessible)
- Add loading states to all buttons and async operations

**Performance:**
- Replace all <img> with Next.js <Image>
- Add proper loading states and skeleton UIs
- Smooth scroll behavior with reduced-motion respect

Apply these changes file by file, starting with layout.tsx and globals.css, then components, then individual pages.
```

---

## 7. DEPENDENCY INSTALLATION COMMANDS

Run these before applying the prompts:

```bash
# Animation library
npm install framer-motion

# Theme management (if not already installed)
npm install next-themes

# Icons (if not already installed)  
npm install lucide-react

# Utility for conditional classes
npm install clsx tailwind-merge

# Progress bar (optional)
npm install nprogress @types/nprogress
```

---

*Generated for TERRAPIN-V2 — An0maly07/TERRAPIN-V2*
