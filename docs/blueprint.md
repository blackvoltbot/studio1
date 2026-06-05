# **App Name**: Number Intel

## Core Features:

- Password Shield Access: A secure full-screen gateway requiring a global site password before access is granted, persisting state in local storage.
- Global Number Search: Direct integration with the intel API (http://number-free1year.vercel.app/?apikey=toxicadminn&number={NUMBER}) to retrieve mobile data insights.
- AI Intelligence tool: A generative AI tool that analyzes raw search data to generate threat summaries and categorization of specific numbers.
- Secure Admin Dashboard: Firestore-backed administration panel to update global access passwords and manage force-logout versions for all sessions.
- Persistence Lookup Log: A locally stored searchable history of previous queries with a clear-data mechanism for user privacy.
- Live Threat Notification System: Real-time toast notifications for system errors, success states, and unauthorized access attempts.

## Style Guidelines:

- Primary color: Aggressive Red (#f20d0d) representing alert states and high security. Background color: Deep Onyx (#0c0707) which is a desaturated variation of the primary hue at 3% brightness. Accent color: Night Orchid (#b31e6b) used for contrast and visual depth.
- Main font: 'Space Grotesk', a tech-inspired sans-serif for a scientific feel. Code/terminal font: 'Source Code Pro' for displaying result data and intel logs.
- Use sharp, minimalist cyber-security icons (e.g., shields, lock-codes, and pulse monitors) styled with red glow filters.
- A sleek dashboard with glassmorphism cards and a responsive grid that works across all devices, featuring matrix-inspired decorative particle backgrounds.
- Implement pulse effects on red buttons, horizontal scanning lines on search, and smooth glass-card fade-ins using Framer Motion.