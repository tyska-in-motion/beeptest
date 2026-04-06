# Interval Master

## Overview

Interval Master is a Polish-language interval training timer application. Users can create, edit, and play custom training sequences with configurable steps, durations, and audio cues. The app provides text-to-speech announcements in Polish and beep signals to guide workouts without needing to watch the screen.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Hook Form for form state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth timer and UI transitions
- **Audio**: Web Audio API for beep sounds, Web Speech API for Polish TTS announcements

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Build System**: Vite for frontend, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Schema**: Single `sequences` table storing training sequences with JSONB steps array
- **Validation**: Zod schemas generated from Drizzle schema via drizzle-zod

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` directory used by both client and server
- **Type-Safe API**: Zod schemas validate both request inputs and response shapes
- **Component Library**: Pre-built shadcn/ui components in `client/src/components/ui/`

### Application Pages
- **Dashboard** (`/`): Lists all training sequences with create/edit/delete/play actions
- **Editor** (`/create`, `/editor/:id`): Form for creating or editing sequences with drag-and-drop step reordering
- **Player** (`/player/:id`): Full-screen timer with audio cues, play/pause/skip controls

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- `connect-pg-simple` for session storage compatibility
- `pg` Node.js driver with connection pooling

### UI Components
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Lucide React icons
- Embla Carousel for carousels
- React Day Picker for calendars
- CMDK for command palette
- Vaul for drawer components

### Build & Development
- Vite with React plugin
- Replit-specific plugins for development (error overlay, cartographer, dev banner)
- TSX for running TypeScript directly

### Validation
- Zod for runtime schema validation
- `@hookform/resolvers` for React Hook Form integration