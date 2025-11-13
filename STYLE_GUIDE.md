# Summit Style Guide

**Version**: 1.0.0
**Last Updated**: October 31, 2025
**Purpose**: Design system and visual standards for Summit rehabilitation platform

---

## 🎨 Design Philosophy

### Core Principles
1. **Soft & Friendly**: Rounded corners, gentle transitions, approachable feel
2. **Modern & Clean**: Minimal design, purposeful white space, clear hierarchy
3. **Professional Healthcare**: Trustworthy, data-focused, credible
4. **Balanced Gamification**: Motivating without being childish, tasteful celebrations

### Brand Personality
- **Supportive**: Encouraging patients through their recovery journey
- **Professional**: Medical credibility with sports medicine expertise
- **Engaging**: Gamified elements that motivate without overwhelming
- **Accessible**: Clear, readable, easy to navigate for all users

---

## 🎨 Color Palette

### Brand Colors

#### Primary - Summit Blue
```css
--summit-blue: #0d3d62;     /* Main brand blue */
--summit-blue-light: #1a5a8a; /* Lighter shade for hover */
--summit-blue-dark: #082943;  /* Darker shade for emphasis */
```

#### Secondary - Summit Gold
```css
--summit-gold: #afa586;      /* Accent gold/tan */
--summit-gold-light: #c4bb9f; /* Lighter shade */
--summit-gold-dark: #968c6f;  /* Darker shade */
```

### Semantic Colors

#### Light Mode
```css
/* Backgrounds */
--background: 0 0% 100%;           /* White */
--foreground: 222.2 84% 4.9%;      /* Near black */
--muted: 210 40% 96.1%;            /* Light gray */
--muted-foreground: 215.4 16.3% 46.9%; /* Gray text */

/* Cards & Surfaces */
--card: 0 0% 100%;                 /* White */
--card-foreground: 222.2 84% 4.9%; /* Near black */
--popover: 0 0% 100%;              /* White */
--popover-foreground: 222.2 84% 4.9%;

/* Interactive Elements */
--primary: 214 84% 22%;            /* Summit blue (HSL) */
--primary-foreground: 210 40% 98%; /* White text on primary */
--secondary: 44 19% 63%;           /* Summit gold (HSL) */
--secondary-foreground: 222.2 47.4% 11.2%;

/* Status Colors */
--success: 142 76% 36%;            /* Green */
--warning: 45 93% 47%;             /* Yellow */
--destructive: 0 84% 60%;          /* Red */
--info: 199 89% 48%;               /* Blue */

/* Borders & Inputs */
--border: 214.3 31.8% 91.4%;       /* Light gray */
--input: 214.3 31.8% 91.4%;        /* Light gray */
--ring: 214 84% 22%;               /* Focus ring (summit blue) */
```

#### Dark Mode (Soft Dark)
```css
/* Backgrounds */
--background: 222 15% 11%;         /* #1a1a1a soft dark */
--foreground: 210 40% 98%;         /* Off-white */
--muted: 217 19% 27%;              /* Dark gray */
--muted-foreground: 215 20% 65%;   /* Light gray text */

/* Cards & Surfaces */
--card: 222 15% 13%;               /* Slightly lighter than bg */
--card-foreground: 210 40% 98%;    /* Off-white */
--popover: 222 15% 13%;            /* Match card */
--popover-foreground: 210 40% 98%;

/* Interactive Elements */
--primary: 214 84% 56%;            /* Lighter summit blue */
--primary-foreground: 222 15% 11%; /* Dark text on primary */
--secondary: 44 19% 70%;           /* Lighter summit gold */
--secondary-foreground: 210 40% 98%;

/* Borders & Inputs */
--border: 217 19% 27%;             /* Dark gray */
--input: 217 19% 27%;              /* Dark gray */
--ring: 214 84% 56%;               /* Focus ring */
```

### Phase Colors (Gamification)
```css
--phase-analyze: #3B82F6;    /* Blue */
--phase-mobilize: #10B981;   /* Green */
--phase-stabilize: #F59E0B;  /* Yellow/Amber */
--phase-optimize: #8B5CF6;   /* Purple */
```

---

## 📝 Typography

### Font Stack

#### Display Font (Headers)
```css
font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 600-800;
```

#### Body Font (Content)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 400-600;
```

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|--------|
| **Display 1** | 4rem (64px) | 800 | 1.1 | Landing hero only |
| **Display 2** | 3rem (48px) | 700 | 1.2 | Major section headers |
| **H1** | 2.5rem (40px) | 700 | 1.3 | Page titles |
| **H2** | 2rem (32px) | 600 | 1.4 | Section headers |
| **H3** | 1.5rem (24px) | 600 | 1.5 | Card titles |
| **H4** | 1.25rem (20px) | 600 | 1.5 | Subsection headers |
| **Body Large** | 1.125rem (18px) | 400 | 1.6 | Lead paragraphs |
| **Body** | 1rem (16px) | 400 | 1.6 | Default text |
| **Body Small** | 0.875rem (14px) | 400 | 1.6 | Secondary text |
| **Caption** | 0.75rem (12px) | 500 | 1.5 | Labels, hints |

---

## 🔘 Components

### Border Radius System
```css
--radius-none: 0;
--radius-sm: 0.375rem;   /* 6px - subtle rounding */
--radius-md: 0.5rem;     /* 8px - default */
--radius-lg: 0.75rem;    /* 12px - cards */
--radius-xl: 1rem;       /* 16px - modals */
--radius-2xl: 1.5rem;    /* 24px - buttons, pills */
--radius-full: 9999px;   /* Perfect circle/pill */
```

### Spacing Scale
```css
/* Based on 4px grid */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Shadow System
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

---

## 🎭 Animation System

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration Scale
```css
--duration-instant: 100ms;
--duration-fast: 200ms;    /* Micro-interactions */
--duration-normal: 300ms;  /* Default transitions */
--duration-slow: 500ms;    /* Page transitions */
--duration-slower: 700ms;  /* Complex animations */
```

### Animation Presets

#### Fade In
```javascript
{
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
}
```

#### Slide Up
```javascript
{
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
}
```

#### Scale In
```javascript
{
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2, ease: "easeOut" }
}
```

#### Stagger Children
```javascript
{
  animate: { transition: { staggerChildren: 0.1 } }
}
```

---

## 🎮 Gamification Elements

### Progress Indicators
- **Progress Bars**: Rounded ends, animated fill, percentage labels
- **Mountain Visualization**: SVG with gradient, animated progress path
- **Streak Counters**: Fire icon, number badge, celebration at milestones
- **Points Display**: Animated counter, "+10" float animations

### Celebrations
- **Confetti**: Summit blue and gold colors, 3-second duration
- **Achievement Badges**: Scale + fade in, subtle glow effect
- **Milestone Animations**: Starburst effect, sound feedback (optional)
- **Success Messages**: Slide down from top, auto-dismiss after 3s

### Visual Feedback
- **Exercise Completion**: Card turns green, checkmark animation
- **Streak Milestone**: Pulsing glow, number emphasis
- **Phase Advancement**: Full-screen transition, mountain peak animation
- **Points Earned**: Number floats up and fades

---

## 🔲 Component Patterns

### Cards
```css
.card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease-out;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: var(--radius-2xl);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.2s ease-out;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-radius: var(--radius-2xl);
  /* Same interaction states as primary */
}
```

### Form Inputs
```css
.input {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease-out;
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgb(13 61 98 / 0.1);
  outline: none;
}
```

### Modals/Dialogs
```css
.modal-overlay {
  background: rgb(0 0 0 / 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  animation: slideUp 0.3s ease-out;
}
```

---

## 📱 Responsive Design

### Breakpoints
```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Container Widths
```css
.container {
  max-width: 100%;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container { max-width: 640px; padding: 0 1.5rem; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; padding: 0 2rem; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

---

## 🌓 Dark Mode Implementation

### Toggle Component Location
- **Primary**: User dropdown menu (top-right)
- **Icon**: Sun (light mode) / Moon (dark mode)
- **Transition**: Smooth 200ms fade between themes
- **Persistence**: LocalStorage + system preference detection

### Theme Context
```javascript
// Using next-themes
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem={true}
  disableTransitionOnChange={false}
>
```

### CSS Variables Strategy
- All colors defined as HSL values
- Single source of truth in CSS variables
- Automatic switching via `dark:` class
- Consistent contrast ratios in both modes

---

## ✅ Accessibility Standards

### Color Contrast
- **Normal Text**: Minimum 4.5:1 ratio
- **Large Text**: Minimum 3:1 ratio
- **Interactive Elements**: Minimum 3:1 against background
- **Focus Indicators**: Visible in both light and dark modes

### Interactive Elements
- **Focus Rings**: 2px solid, offset 2px
- **Touch Targets**: Minimum 44x44px
- **Hover States**: Clear visual feedback
- **Active States**: Distinct from hover

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🚀 Implementation Checklist

### Phase 1: Foundation
- [ ] Update Tailwind config with new colors
- [ ] Install next-themes
- [ ] Create ThemeProvider
- [ ] Update CSS variables
- [ ] Add theme toggle to UI

### Phase 2: Components
- [ ] Update all shadcn/ui components
- [ ] Create animated card component
- [ ] Add skeleton loaders
- [ ] Create progress bar component

### Phase 3: Animations
- [ ] Install Framer Motion
- [ ] Add page transitions
- [ ] Implement micro-interactions
- [ ] Add celebration animations

### Phase 4: Polish
- [ ] Update all dashboards
- [ ] Enhance gamification visuals
- [ ] Add loading states
- [ ] Final accessibility audit

---

## 📚 Usage Examples

### Using Brand Colors
```jsx
// Tailwind classes
<div className="bg-summit-blue text-white">
<div className="text-summit-gold border-summit-gold-light">

// CSS variables
<div style={{ color: 'var(--summit-blue)' }}>
```

### Implementing Animations
```jsx
// Framer Motion
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Dark Mode Toggle
```jsx
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();

<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

---

## 🎯 Design Goals

1. **Consistency**: Every element follows the design system
2. **Performance**: Animations don't impact performance
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Maintainability**: Easy to update and extend
5. **Brand Alignment**: Reflects Summit Sports Chiro identity

---

**Last Updated**: October 31, 2025
**Next Review**: After implementation complete