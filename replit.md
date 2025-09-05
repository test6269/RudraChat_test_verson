# Real-time Chat Application

## Overview

This is a real-time chat application built with React and Express that allows users to sign up, add friends, and exchange messages. The application features a modern UI built with shadcn/ui components and uses WebSockets for real-time messaging. Users are assigned unique registration numbers (r_no) for identification and friend discovery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based architecture using functional components and hooks
- **UI Framework**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming support
- **State Management**: React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Express.js Server**: RESTful API with middleware for logging and error handling
- **WebSocket Integration**: Real-time messaging using WebSocket Server for live chat functionality
- **Authentication**: Simple session-based authentication with bcrypt password hashing
- **Data Storage**: In-memory storage implementation with interface design for easy database migration
- **Schema Validation**: Zod schemas shared between client and server for consistent data validation

### Database Design
- **Users Table**: Stores user profiles with unique r_no identifiers, names, and hashed passwords
- **Friends Table**: Junction table managing friend relationships with status tracking (pending/accepted/rejected)
- **Messages Table**: Stores chat messages with sender/receiver references and timestamps
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect configuration

### Real-time Communication
- **WebSocket Server**: Handles persistent connections for instant message delivery
- **Message Broadcasting**: Routes messages between authenticated users in real-time
- **Connection Management**: Tracks user sessions and handles reconnection scenarios

### Security Implementation
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Zod schemas prevent invalid data submission
- **CORS Configuration**: Secure cross-origin request handling
- **Session Management**: User session tracking for authenticated operations

### Build System
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Full type safety across frontend and backend
- **Path Aliases**: Clean import statements with @ prefixes for better organization
- **Development Tools**: Hot module replacement and error overlay for development experience

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon set for UI elements
- **shadcn/ui**: Pre-built component library with customizable design tokens

### Form and Validation
- **React Hook Form**: Performant form management with minimal re-renders
- **Zod**: Runtime type validation for form inputs and API requests
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation

### Development and Build Tools
- **TypeScript**: Static type checking and enhanced developer experience
- **Vite**: Modern build tool with fast hot module replacement
- **PostCSS**: CSS processing with Tailwind CSS integration
- **ESBuild**: Fast JavaScript bundling for production builds

### Backend Infrastructure
- **WebSocket (ws)**: Real-time bidirectional communication
- **bcrypt**: Secure password hashing and verification
- **Express**: Web application framework with middleware support
- **CORS**: Cross-origin resource sharing configuration