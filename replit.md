# Chicken Poop Bingo - Nonprofit Fundraising Platform

## Overview

Chicken Poop Bingo is a real-time fundraising application designed for nonprofit organizations to manage square game events. The system provides an interactive grid-based game where participants can purchase squares for fundraising purposes. It features a dual-interface design with a seller-facing interface for participant registration and square selection, and an admin dashboard for event management and oversight.

The application operates as a full-stack web platform with real-time updates, payment processing capabilities, and comprehensive game management tools. It's built to handle multiple game rounds and provides detailed analytics and participant management features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live board updates
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the entire stack
- **Real-time Features**: WebSocket Server for live updates and board synchronization
- **Data Validation**: Zod schemas shared between frontend and backend
- **Development Setup**: Development server with hot reloading and error overlay

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (@neondatabase/serverless) for serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Persistent Storage**: Complete PostgreSQL implementation with marketing data persistence
- **Fallback Storage**: In-memory storage implementation for development/testing environments

### Database Schema Design
- **Game Rounds**: Manages multiple fundraising rounds with status tracking, winner recording, completion timestamps, and configurable winner percentage (default 50%)
- **Participants**: Stores participant information, contact details, payment status, and game round association for marketing purposes
- **Squares**: Individual square entities with availability status, ownership tracking, and reservation timestamps
- **Relationships**: Foreign key relationships between game rounds, participants, and squares
- **Marketing Features**: Complete historical data retention for participant tracking, winner records, and fundraising analytics
- **Winner Split Configuration**: Each game round has a configurable winner percentage (0-100%) that determines pot distribution between winner and charity

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Access Control**: Route-based access control for admin and seller interfaces
- **Admin Password Protection**: Secure authentication system for sensitive admin functions (export data, reset system)
- **Environment-based Security**: Admin password configured via ADMIN_PASSWORD environment variable
- **Security**: CORS configuration and secure session handling

### API Architecture
- **RESTful Endpoints**: Standard REST API for CRUD operations
- **Marketing Endpoints**: Specialized endpoints for participant data export, winner tracking, and historical analysis
- **Export Features**: Enhanced multi-round CSV export with automatic backup before system reset
- **Admin Management**: Game round completion, new round creation, and comprehensive winner management
- **Real-time Updates**: WebSocket endpoints for live board updates
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Data Serialization**: JSON-based API with Zod validation

### Payment Integration Architecture
- **QR Code Generation**: Dynamic QR code generation for Venmo and Zelle payments using real account information
- **Environment Configuration**: Configurable Venmo username and Zelle email via environment variables
- **Payment Tracking**: Payment status management with pending/paid states
- **Multi-payment Support**: Flexible payment method integration

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router alternative (Wouter)
- **Build Tools**: Vite with TypeScript support and React plugin
- **Development Tools**: TSX for TypeScript execution, ESBuild for production builds

### UI and Styling Libraries
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating variant-based component APIs

### Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **Drizzle ORM**: Type-safe PostgreSQL ORM with schema management
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation and formatting utilities

### Backend Infrastructure
- **Express.js**: Web application framework for Node.js
- **WebSocket (ws)**: Real-time bidirectional communication
- **Connect-pg-simple**: PostgreSQL session store for Express
- **Neon Database**: Serverless PostgreSQL database provider

### Development and Build Tools
- **TypeScript**: Static type checking across the entire stack
- **Vite Plugins**: Runtime error modal, development cartographer
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **Drizzle Kit**: Database schema management and migration tools

### Utility Libraries
- **QRCode**: QR code generation for payment methods
- **clsx/twMerge**: Conditional CSS class management
- **CMDK**: Command palette component for enhanced UX
- **React Hook Form**: Performant form library with validation
- **Embla Carousel**: Touch-friendly carousel component

### Replit Integration
- **Replit-specific Tools**: Development banner, runtime error modal, and cartographer for Replit environment optimization

## Recent Updates

### Winner Percentage Split Feature (October 2025)
- **Configurable Split**: Admins can configure what percentage of the pot goes to the winner vs charity (default 50/50)
- **Database Schema**: Added `winnerPercentage` field to `game_rounds` table with default value of 50
- **Admin UI**: Added winner percentage control in admin dashboard with nullish coalescing to handle 0% edge case
- **API Enhancement**: Updated winner endpoints to calculate and return `winnerAmount` and `charityAmount` based on percentage
- **Display Updates**: Winner displays, toast notifications, and receipt pages now show the split amounts clearly
- **Docker Integration**: Automated database migrations included in Docker deployment

## Deployment

### Docker Deployment
- **Multi-stage Build**: Optimized Docker build with production bundle
- **Automatic Migrations**: Database schema changes applied automatically on container startup via `docker-startup.sh`
- **Health Checks**: Built-in health checks for both application and database
- **Environment Variables**: Comprehensive environment configuration via `.env` file
- **Persistent Storage**: PostgreSQL data and application logs persisted via Docker volumes
- **Security**: Non-root user execution, secure session handling, and configurable admin password

### Deployment Files
- **Dockerfile**: Multi-stage build with TypeScript compilation and production bundling
- **docker-compose.yml**: Service orchestration for app and PostgreSQL database
- **docker-startup.sh**: Startup script that runs migrations before starting server
- **.env.example**: Template for all required and optional environment variables
- **DOCKER-DEPLOYMENT.md**: Complete deployment guide with troubleshooting