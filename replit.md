# Latest Talks - Yiddish Jewish Podcast Platform

## Overview
Latest Talks is the largest Jewish network in Yiddish, offering high-quality entertainment through engaging podcast conversations. This full-stack web application serves as the official platform for the podcast website, aiming to provide a comprehensive digital presence for content delivery, community engagement, and operational management. The platform features extensive episode management, sponsor systems with analytics, membership services, and robust tools for internal operations and external partner integrations.

## User Preferences
I prefer clear and concise communication. When making changes, please prioritize the most impactful modifications first. For any significant architectural decisions or changes to core features, please ask for confirmation before proceeding. I prefer to iterate on features, starting with a minimal viable product and adding complexity incrementally.

## System Architecture
The application is a full-stack web application utilizing React with TypeScript, TailwindCSS, and Shadcn UI for the frontend, and an Express.js server with TypeScript for the backend. Data persistence is handled by PostgreSQL (Neon) with Drizzle ORM.

**UI/UX Decisions:**
- **Branding:** Adheres to `design_guidelines.md` with primary colors: Navy #10213A, Red #DE2026, Cream #F0EDEB, and Poppins font.
- **Components:** Reusable UI components built with Shadcn UI for a consistent look and feel.

**Technical Implementations & Feature Specifications:**
- **Episode Management:** Episodes are embedded from YouTube, with an auto-fill feature for metadata from YouTube URLs. Supports premium content gating. Episode descriptions are edited with a TipTap-based rich text editor (bold, italic, underline, lists, headings, links with an in-app link dialog).
- **Sponsor System:** Features sponsor showcases, milestone tracking, comprehensive contact fields, promo details (with datetime-local expiration picker), and email open tracking with analytics. Prime sponsors are visually highlighted. Supports multiple promo codes per sponsor via the `sponsor_promo_codes` table, managed through a dedicated dialog with add/toggle/delete/copy functionality.
- **Newsletter & Community:** Newsletter signup for updates. An "In-Flight Community" feature allows users to upload photos/videos featuring Latest Talks content, with flight route auto-fill and anonymous submission options.
- **Membership (Latest Talks+):** Offers a premium subscription service with exclusive content access, manual payment processing, and admin-controlled access.
- **Community Page:** A public hub with discussion boards (threaded replies, moderation) and a photo gallery.
- **Guest Profiles:** Dedicated profile pages for podcast guests, featuring bios, contact info, social links, and associated episodes.
- **Admin & Operations:**
    - **Authentication:** Secure admin login with password management.
    - **Operations Dashboard:** Manages team directory, guest pipeline, financial reports, sponsor deals, projects, and expenses.
- **WhatsApp Broadcast Integration:** Utilizes Meta Cloud API for broadcasting messages to opted-in subscribers, including template-based messaging and delivery tracking.
- **Platform KPI Integration System:** Allows external podcast platforms to submit episode KPI data (Watch Time, Views, Average Watch Time). Features platform-specific user logins, spreadsheet-style data editing, auto-calculation, history logging, data drop warnings, and episode locking. An admin dashboard provides aggregated metrics.
- **Admin Notification Badges:** Per-admin sidebar notification system tracking new items across 8 sections (Comments, Messages, Guest Applications, LT+ Members, Subscribers, WhatsApp, Community Photos, Bug Reports). Uses `admin_section_views` table to track each admin's `lastViewedAt` per section. Badges auto-clear when admin navigates to a section, and only clear for that specific admin.
- **Bug Reporting System:** A public form for submitting bug reports with categories, priority levels, status tracking, and admin management with email replies.

**System Design Choices:**
- **Frontend Routing:** Wouter for client-side navigation.
- **Backend Routing:** Express handles API routes.
- **Database Schema:** Drizzle ORM defines the database schema and types, shared between client and server for consistency.
- **Storage:** Abstracted storage interface (`IStorage`) with a PostgreSQL implementation (`DatabaseStorage`).

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Frontend UI Library:** Shadcn UI
- **Data Fetching:** TanStack Query
- **Routing (Frontend):** Wouter
- **YouTube API:** For fetching video metadata.
- **AviationStack API:** For auto-filling flight route information in the In-Flight Community feature.
- **Postmark:** For sending email replies in the Bug Reporting System.
- **Meta Cloud API:** For WhatsApp broadcast integration.
- **Stripe:** Used for managing Latest Talks+ memberships and payments (checkout sessions, customer portal, webhooks).