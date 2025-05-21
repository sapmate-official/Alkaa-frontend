# ALKAA - HR Management System
## Software Requirements Specification (SRS)

![Alkaa Logo](public/assets/logo_icon.svg)

## Table of Contents
- [Introduction](#introduction)
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [User Roles and Access Control](#user-roles-and-access-control)
- [Functional Requirements](#functional-requirements)
  - [User Management](#user-management)
  - [Department Management](#department-management)
  - [Role & Permission Management](#role--permission-management)
  - [Employee Management](#employee-management)
  - [Attendance Management](#attendance-management)
  - [Leave Management](#leave-management)
  - [Payroll Management](#payroll-management)
  - [Holiday Management](#holiday-management)
  - [Notifications](#notifications)
  - [Organization Settings](#organization-settings)
  - [Billing & Subscription](#billing--subscription)
- [Non-Functional Requirements](#non-functional-requirements)
- [Technical Specifications](#technical-specifications)
- [Data Models](#data-models)
- [Integrations](#integrations)
- [Deployment](#deployment)

## Introduction

Alkaa is a comprehensive HR Management System designed to streamline workforce management processes across organizations of all sizes. The platform offers end-to-end solutions for employee management, attendance tracking, leave management, payroll processing, and organizational administration.

### Purpose
The purpose of this system is to provide organizations with a robust platform to efficiently manage their human resources, automate administrative tasks, and generate valuable insights through centralized data management.

### Scope
Alkaa covers the entire lifecycle of employee management from onboarding to exit, with modules for attendance tracking, leave management, payroll processing, and comprehensive reporting while maintaining proper permission controls across organizational hierarchies.

## System Overview

Alkaa consists of three main components:
1. **Main Platform** - The core HR management system used by organizations
2. **Admin Platform** - A separate system for super administrators to manage organizations and billing
3. **Mobile Applications** - Companion apps for employees to access common features on the go

The system follows a multi-tenant architecture, allowing multiple organizations to securely use the platform with isolated data environments.

## Architecture

### Technical Architecture
- **Frontend**: React with TypeScript, using modern React hooks and state management
- **Backend**: Node.js with Express framework
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with refresh token mechanism
- **API**: RESTful API design with versioning (v2, v3)
- **Notification System**: Push notifications, email notifications, and in-app alerts

### Component Architecture
- **Client Layer**: React SPA with responsive design, Progressive Web App capabilities
- **API Layer**: Express.js API with middleware for authentication, validation, and error handling
- **Service Layer**: Business logic and data processing components
- **Data Access Layer**: Prisma ORM for database operations
- **External Services**: Email delivery, PDF generation, payment processing

## User Roles and Access Control

Alkaa implements a sophisticated role-based access control system:

### Core User Types
1. **Super Admin**: System-level administrators who manage organizations, subscription plans, and billing
2. **Organization Admin**: Organization-level administrators who manage settings, departments, and users
3. **Managers**: Department heads and team leaders who manage subordinates
4. **Employees**: Regular users with limited access to their own records and team information

### Permission System
- **Module-based permissions**: Granular access control for each functional module
- **Action-based permissions**: Create, Read, Update, Delete operations controlled separately
- **Scope-based permissions**: Control over whose data a user can access (own, team, all)
- **Custom roles**: Organizations can create custom roles with specific permission sets
- **Permission presets**: Pre-configured permission sets for common organizational roles

## Functional Requirements

### User Management

#### User Registration & Authentication
- **User Creation**: Organization admins can create user accounts
- **Email Verification**: Verification process for new user accounts
- **Password Management**: Secure password reset and recovery flows
- **Multi-factor Authentication**: Optional additional security layer
- **Session Management**: JWT-based authentication with refresh tokens
- **Account Activation/Deactivation**: Control over user account status

#### User Profile Management
- **Personal Information**: Management of personal details like name, contact info
- **Employment Information**: Job title, employee ID, department, manager
- **Bank Details**: Banking information for payroll processing
- **Document Management**: Upload and storage of employment documents
- **Profile Customization**: User preferences and notification settings

### Department Management

- **Department Creation**: Create organizational units with hierarchical structures
- **Department Hierarchies**: Support for parent-child relationships between departments
- **Department Heads**: Assignment of department leaders with special permissions
- **Employee Assignment**: Allocation of employees to departments
- **Department Reports**: Analytics and reports on department performance
- **Department Settings**: Department-specific configurations

### Role & Permission Management

- **Role Creation**: Define custom roles with specific access levels
- **Permission Assignment**: Grant or revoke permissions for specific roles
- **Role Assignment**: Assign roles to users
- **Permission Categories**: Logical grouping of permissions by functional area
- **Permission Auditing**: Track permission changes and role assignments
- **Permission Inheritance**: Hierarchical permission structures

### Employee Management

- **Employee Onboarding**: Structured process for adding new employees
- **Employee Data Management**: Comprehensive employee records
- **Employee Hierarchy**: Management of reporting relationships
- **Employee Status Tracking**: Active, inactive, on leave, terminated statuses
- **Employee Search & Filtering**: Advanced search capabilities
- **Employment History**: Track changes in employee status, position, or department
- **Performance Tracking**: Basic performance management features

### Attendance Management

- **Check-In/Check-Out**: Time tracking for employees with location data
- **Multiple Sessions**: Support for multiple work sessions per day
- **Remote Work Tracking**: Attendance management for remote employees
- **Attendance Verification**: Manager verification of subordinate attendance
- **Session Management**: Track work duration, breaks, and overtime
- **Attendance Reports**: Daily, weekly, monthly attendance summaries
- **Past Attendance Correction**: Workflow for addressing missed check-ins
- **Attendance Analytics**: Insights on attendance patterns and working hours
- **Daily Work Reports**: Employee reporting on daily activities

### Leave Management

- **Leave Types**: Configurable leave categories (sick, vacation, personal, etc.)
- **Leave Balance Management**: Tracking available leave days by type
- **Leave Application**: Employee request workflow with supporting documents
- **Leave Approval Flow**: Multi-level approval process
- **Calendar Integration**: Leave calendar with team visibility
- **Leave Cancellation**: Process for cancelling approved leave
- **Leave Reporting**: Comprehensive leave reports by employee, team, or department
- **Annual Leave Carryover**: Configuration for leave balance transitions between years
- **Leave Balance Adjustments**: Administrative tools to adjust leave balances

### Payroll Management

- **Salary Structure**: Configuration of basic salary and allowances
- **Payroll Calculation**: Automated salary calculation based on attendance and leaves
- **Tax Calculation**: Basic tax computations and deductions
- **Payroll Approval**: Multi-stage approval process for payroll
- **Payslip Generation**: PDF generation of detailed payslips
- **Payment Processing**: Support for various payment methods
- **Salary Revisions**: Management of salary changes and increments
- **Bonus Management**: Processing of bonuses and incentives
- **Deduction Management**: Standard and custom salary deductions
- **Payroll Reports**: Comprehensive reporting for accounting and compliance
- **Bulk Payroll Processing**: Process payments for multiple employees

### Holiday Management

- **Holiday Configuration**: Organization-wide and region-specific holidays
- **Holiday Calendar**: Visual calendar of holidays and observances
- **Holiday Types**: Different categories of holidays (national, optional, organizational)
- **Holiday Impact**: Integration with attendance and leave calculations
- **Holiday Notifications**: Reminders about upcoming holidays

### Notifications

- **Notification Templates**: Configurable templates for different notification types
- **Notification Channels**: Email, push, and in-app notifications
- **Event-based Notifications**: Automated notifications for system events
- **Notification Preferences**: User control over notification delivery
- **Notification History**: Record of past notifications
- **Batch Notifications**: Mass notification capabilities

### Organization Settings

- **Company Information**: Basic organization details and branding
- **Working Hours Configuration**: Define standard working hours and shifts
- **Week-off Settings**: Configure weekly days off and work week structure
- **Email Templates**: Organization-specific communication templates
- **Organization Hierarchy**: Define and manage the organizational structure
- **Data Export/Import**: Tools for bulk data operations
- **Audit Logs**: Track system changes and user actions

### Billing & Subscription

- **Subscription Plans**: Tiered pricing based on features and user count
- **Billing Management**: Invoice generation and payment tracking
- **Payment Processing**: Multiple payment methods
- **Usage Tracking**: Monitor active users and feature utilization
- **Plan Upgrades/Downgrades**: Process for changing subscription plans
- **Billing Reports**: Financial reports for subscription fees
- **Payment History**: Record of past payments and invoices
- **Invoice Generation**: Automated and manual invoice creation

## Non-Functional Requirements

### Performance
- **Response Time**: Average page load time under 2 seconds
- **Concurrent Users**: Support for hundreds of simultaneous users
- **Scalability**: Horizontal scaling capabilities for growing organizations
- **Database Performance**: Optimized queries and indexing

### Security
- **Data Encryption**: Encryption for sensitive data at rest and in transit
- **Authentication**: Secure login procedures with multi-factor options
- **Authorization**: Strict role-based access control
- **Password Policies**: Configurable password requirements
- **Data Isolation**: Complete tenant separation in multi-tenant environment
- **Security Auditing**: Logs of security-relevant events
- **Compliance Features**: Tools to help meet GDPR, CCPA, and other regulations

### Reliability
- **Availability**: 99.9% uptime target
- **Data Backup**: Regular automated backups
- **Disaster Recovery**: Procedures for data restoration
- **Error Handling**: Graceful handling of system errors

### Usability
- **Responsive Design**: Support for various screen sizes and devices
- **Accessibility**: Compliance with WCAG guidelines
- **Intuitive Interface**: User-friendly navigation and workflows
- **Help System**: Context-sensitive help and documentation
- **Onboarding**: Interactive tutorials for new users

### Maintainability
- **Modular Architecture**: Component-based design for easier maintenance
- **Coding Standards**: Consistent patterns across the codebase
- **Documentation**: Comprehensive technical and user documentation
- **Testing**: Automated test suites covering core functionality

## Technical Specifications

### Frontend Technology Stack
- **Framework**: React with TypeScript
- **State Management**: Jotai for atomic state management
- **UI Components**: Custom component library with Radix UI primitives
- **Styling**: Tailwind CSS for utility-first styling
- **HTTP Client**: Axios for API communication
- **Form Handling**: Custom form hooks
- **Date Manipulation**: Date-fns library
- **PDF Generation**: Client-side PDF creation for reports and documents

### Backend Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma for database operations
- **Authentication**: Custom JWT implementation
- **Email Service**: Integration with email delivery providers (Resend)
- **File Storage**: Local and cloud-based file storage options
- **Background Processing**: Job queue for asynchronous tasks

### Database
- **RDBMS**: PostgreSQL
- **Schema Management**: Prisma migrations
- **Backup Strategy**: Regular automated backups
- **Performance Optimization**: Proper indexing and query optimization

## Data Models

Alkaa implements a comprehensive data model including the following core entities:

### Core Entities
- **Organization**: Multi-tenant organization data
- **User**: Employee and system user information
- **Department**: Organizational structure units
- **Role**: User roles with permission sets
- **Permission**: Granular access control definitions
- **AttendanceRecord**: Time tracking and session data
- **LeaveRequest**: Employee leave applications and approvals
- **LeaveType**: Organization-specific leave categories
- **LeaveBalance**: Individual leave allocations and usage
- **SalaryRecord**: Monthly salary calculations and payment status
- **SalaryParameter**: Individual salary configuration
- **BankDetails**: Employee bank information
- **Holiday**: Organization holidays and observances
- **Notification**: System and user notifications
- **NotificationTemplate**: Templates for automated communications
- **SubscriptionPlan**: Service tiers and pricing
- **BillingRecord**: Invoices and payment records

## Integrations

### Current Integrations
- **Email Service**: Email delivery integration for notifications
- **PDF Generation**: Document creation for payslips and reports
- **Push Notifications**: Browser-based push notification service

### Planned Integrations
- **Calendar Systems**: Integration with popular calendar applications
- **Payment Gateways**: Additional payment processing options
- **Accounting Software**: Export data to accounting systems
- **HRMS Standards**: Compliance with HR data exchange standards
- **Document Management**: Integration with document storage systems
- **Single Sign-On**: Enterprise authentication systems

## Deployment

### Deployment Options
- **Cloud Hosting**: Primary deployment on cloud infrastructure
- **Self-Hosted**: Enterprise option for on-premise deployment
- **Development Environment**: Local development setup with containerization
- **Testing Environment**: Staging environment for QA and testing
- **Production Environment**: Scalable production infrastructure

### Security Measures
- **SSL/TLS**: Encrypted communication
- **CI/CD**: Automated testing and deployment pipeline
- **Vulnerability Scanning**: Regular security assessments
- **Access Controls**: Restricted production environment access
- **Monitoring**: Real-time system monitoring and alerting