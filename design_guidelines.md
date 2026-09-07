# Latest Talks - Modernized Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from premium entertainment platforms (Spotify, Netflix, Apple Podcasts) with bold gradients, dynamic visuals, and energetic layouts. The design balances contemporary aesthetics with Jewish cultural warmth.

## Color System

### Core Brand Colors
- **Navy**: `#10213A` - Primary brand color
- **Red**: `#DE2026` - Accent and energy
- **Cream**: `#F0EDEB` - Soft background

### Gradient Palette
- **Hero Gradient**: Navy (#10213A) → Deep Purple (#1A0F2E) → Navy (diagonal 45deg)
- **Accent Gradient**: Red (#DE2026) → Orange (#FF6B35) (horizontal)
- **Card Hover Gradient**: Navy with 10% Red overlay (radial from center)
- **Background Gradient**: Cream (#F0EDEB) → Light Pink (#F5E8E4) (subtle vertical)
- **Overlay Gradients**: Black 60% opacity → Transparent (for image overlays)

### Supporting Colors
- White: `#FFFFFF`
- Light Gray: `#E5E2E0`
- Dark Gray: `#666666`
- Glow Red (for effects): `#DE2026` with 40% opacity

## Typography
**Poppins** (Google Fonts) - All weights 300-700

### Hierarchy
- Display/Hero: 56px / 3.5rem, Bold, -1% letter-spacing
- Page Title: 40px / 2.5rem, SemiBold
- Section Heading: 28px / 1.75rem, SemiBold
- Card Title: 20px / 1.25rem, SemiBold
- Body Large: 18px / 1.125rem, Regular
- Body: 16px / 1rem, Regular
- Small: 14px / 0.875rem, Regular
- Caption: 12px / 0.75rem, Medium

## Layout System
**Spacing**: Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24
- Sections: py-16 (mobile), py-24 (desktop)
- Cards: p-6 to p-8
- Container: max-w-7xl, px-6 (mobile), px-8 (desktop)

## Component Library

### Navigation
- Fixed top navbar with blurred backdrop (backdrop-blur-md)
- Navy background with 95% opacity
- White text with red underline on active
- Mobile: Slide-in menu with gradient overlay

### Hero Section
- Full-width with large hero image (16:9 aspect ratio)
- Diagonal navy-to-purple gradient overlay (60% opacity)
- Centered content with white text
- Two CTAs: Primary (red gradient button) + Secondary (white outline)
- Buttons have backdrop-blur-sm backgrounds

### Episode Cards
- White background with 12px border radius
- Thumbnail: 16:9 ratio with subtle gradient overlay on hover
- Hover: Lift effect (translateY -4px) with red glow shadow
- Play button: Circular red gradient, white icon, blur background

### Featured Episodes Grid
- 3 columns (desktop), 2 (tablet), 1 (mobile)
- Staggered card heights for visual interest
- Category tags with gradient backgrounds

### Podcast Categories
- Horizontal scrolling carousel
- Circular category cards with gradient backgrounds
- Icon + title overlay with blur effect

### Newsletter/CTA Sections
- Accent gradient backgrounds (red-to-orange)
- White text and form elements
- Input fields with white borders, subtle shadows
- Submit button: Navy with white text

### Footer
- Multi-column layout (4 columns desktop, stack mobile)
- Navy gradient background
- White text with red accent links
- Social icons: 24px, red on hover
- Newsletter signup integrated

## Images

### Hero Image
Large, dynamic image showing podcast recording or vibrant community gathering. Position: Top of homepage, full-width, 70vh height. Apply diagonal gradient overlay for text readability.

### Episode Thumbnails
16:9 ratio images for each episode card. High-quality, engaging shots of guests or thematic visuals. Apply subtle gradient overlay on hover.

### Category Icons
Colorful, modern icons representing different podcast categories (Torah, Culture, Business, Lifestyle). Use with gradient backgrounds.

### About/Team Section
Authentic photos of hosts and team members. Grid layout with rounded corners (12px). Light gradient overlays.

## Visual Effects

### Gradients Usage
- Hero: Diagonal overlay (45deg)
- CTAs: Horizontal accent gradient
- Card hovers: Radial from cursor position
- Backgrounds: Subtle vertical cream-to-pink

### Shadows & Glows
- Cards: `shadow-lg` default, `shadow-2xl` with red glow on hover
- Buttons: Red glow effect (box-shadow with red color)
- Elevated elements: Layered shadows for depth

### Blur Effects
- Navigation backdrop: `backdrop-blur-md`
- Buttons on images: `backdrop-blur-sm`
- Category overlays: `backdrop-blur-lg`

### Animations
- Card hover: Transform scale(1.02) + lift, 300ms
- Button hover: Glow intensity increase, 200ms
- Page load: Fade-up for sections, stagger by 100ms
- Scroll: Parallax effect on hero (subtle)

## Accessibility
- Maintain WCAG AA contrast ratios
- Focus states: Red outline (3px)
- Keyboard navigation fully supported
- ARIA labels for all interactive elements

## Icons
**Lucide React** via CDN
- UI elements: 20-24px
- Social media: 24px
- Play buttons: 32px