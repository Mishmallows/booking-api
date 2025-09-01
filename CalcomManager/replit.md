# Overview

This is a Node.js REST API service that provides an integration layer for Cal.com booking operations. The service acts as a middleware between client applications and the Cal.com API, offering endpoints for rescheduling and canceling bookings with proper validation, logging, and error handling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
- **Framework**: Express.js server with modular route organization
- **API Design**: RESTful endpoints following standard HTTP conventions
- **Middleware Stack**: CORS enabled, JSON body parsing with 10MB limit, request logging, and API key validation
- **Error Handling**: Global error handler with structured error responses and comprehensive logging

## Code Organization
- **Routes**: Separated into dedicated route files (`/routes/bookings.js`)
- **Services**: Business logic abstracted into service classes (`CalComService`)
- **Middleware**: Reusable validation and authentication middleware
- **Utils**: Centralized logging utility with configurable log levels

## Data Flow
- Incoming requests validated through middleware chain
- Service layer handles Cal.com API interactions with axios HTTP client
- Structured JSON responses with success/error status and timestamps
- Request/response logging for debugging and monitoring

## Security & Validation
- API key authentication for protected endpoints
- Comprehensive input validation for booking operations
- Request body sanitization and type checking
- Date validation and business rule enforcement (e.g., no past dates, start before end time)

## Configuration Management
- Environment-based configuration using dotenv
- Configurable port, host, and log levels
- API key management through environment variables

# External Dependencies

## Third-Party Services
- **Cal.com API**: Primary integration for booking management operations (reschedule, cancel)
- **API Endpoint**: `https://api.cal.com/v1`
- **Authentication**: Bearer token authentication

## NPM Packages
- **express**: Web framework for API server
- **axios**: HTTP client for Cal.com API communication with interceptors for logging
- **cors**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

## Runtime Requirements
- **Node.js**: Runtime environment
- **Environment Variables**: `CAL_API_KEY`, `PORT`, `LOG_LEVEL`

## API Integration Details
- 30-second timeout for external API calls
- Automatic request/response logging with axios interceptors
- Structured error handling for API failures
- JSON content-type for all Cal.com communications