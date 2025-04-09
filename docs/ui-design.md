# UI Design Document

## Overview

Idea Wall is an enterprise-grade web application focused on idea management and innovation collaboration. The UI design emphasizes simplicity, usability, and professionalism, targeting enterprise employees across all levels.

## Design Philosophy

### Visual Style

- **Professional**: Clean, modern interface suitable for enterprise environments
- **Innovative**: Visual elements that reflect innovation and collaboration
- **PrimeNG Integration**: Utilizing PrimeNG components for consistent enterprise-grade UI elements
- **Performance-First**: Fast loading times and smooth transitions
- **Information Density**: Efficient presentation of complex ideation information

## URL Structure

### Idea Pages

- Idea List: `/ideas`
- Idea Detail: `/ideas/{idea-id}`

### Profile Center

- My Ideas: `/profile/ideas`
- Points Center: `/profile/points`
- Settings: `/profile/settings`

## Navigation Structure

### Breadcrumb Navigation

- Idea Detail: `Home > Idea Wall > {Idea Title}`
- Review Page: `Home > Review Center > {Review Title}`
- Profile Center: `Home > Profile > {Specific Page}`

### Search Integration

- Global search bar (supports Ctrl/Cmd + K shortcut)
- Search suggestions displaying idea titles and tags
- Advanced search with multi-dimensional filtering

## Layout Design

### Global Layout

#### Header Navigation Bar

- Fixed position at viewport top
- Height: 64px
- Maximum width: 1440px
- Components:
  - Site logo
  - Main navigation menu
  - Search bar
  - Notification center
  - User menu

#### Main Navigation Menu

- Idea Wall
- Review Center
- About Us

#### User Menu

- User avatar
- Username
- Role display
- Dropdown menu:
  - My Ideas
  - Points Center
  - Settings
  - Sign Out

### Idea Wall Page

#### Ideas Display Area

- Idea Categories
  - Idea
  - Pain
  - Thought
- Tag filters
- Sort options:
  - Latest created
  - Most upvoted
- Pagination controls

#### Idea Card

- Title
- Description preview
- Category labels
- Creator information
- Upvote count
- Comment count

### Idea Detail Page

#### Header Information

- Idea title
- Creator information
- Creation timestamp
- Action button group

#### Content Layout

- Main content area (70%):
  - Idea description
  - Tag list
  - Comment section
- Information sidebar (30%):
  - Voting metrics
  - Related ideas

#### Comment System

- Comment input field
- Comment thread list
- Reply functionality
- @mention support

## Interactive Elements

### Button Styles

- Primary: Solid background
- Secondary: Outlined
- Text: Plain text
- Icon: With tooltips

### Form Elements

- Input validation
- Helper text
- Error states
- Loading states
- Autocomplete

### Feedback Mechanisms

- Toast notifications
- Loading indicators

## Responsive Design

- Desktop-first (minimum width: 1024px)
- Common resolution support:
  - 1920x1080
  - 1440x900
  - 2560x1440
- Mobile adaptations:
  - Collapsible navigation
  - Responsive card layouts
  - Optimized form elements

## Theme Colors

### Primary Palette

- Primary: #2563eb (Blue)
- Secondary: #64748b (Slate)
- Accent: #0ea5e9 (Light Blue)

### Functional Colors

- Success: #22c55e
- Warning: #f59e0b
- Error: #ef4444
- Info: #3b82f6

### Neutral Colors

- Background: #ffffff
- Text: #1e293b
- Border: #e2e8f0
- Divider: #f1f5f9

## Typography System

### Font Stack

- Primary: -apple-system, BlinkMacSystemFont, Segoe UI
- Fallback: Arial, sans-serif
- Monospace: Menlo, Monaco, Consolas

### Type Scale

- Display: 24px
- Heading: 20px
- Subheading: 16px
- Body: 14px
- Caption: 12px

## Iconography

### Icon System

- Consistent icon library
- Customizable colors
- Multiple sizes
- Unified style
- SVG format preferred

### Icon Usage

- Navigation indicators
- Action buttons
- Status indicators
- Feature illustrations

## Accessibility

### Standards Compliance

- WCAG 2.1 Level AA
- Keyboard navigation
- Screen reader support
- Sufficient color contrast
- Focus indicators

### Inclusive Design

- Clear visual hierarchy
- Consistent navigation patterns
- Alternative text for images
- Resizable text support
