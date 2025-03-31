# WORKSPACE & DASHBOARD ARCHITECTURE

## WORKSPACE (Workspace.js)

The Workspace serves as the central hub for users after authentication, providing access to all projects, files, and system features through an intuitive interface.

### Navigation and User Interface Components

**Profile Section**
- Located in the header, displays a clickable profile icon
- Expands to show user information including:
  - Active status indicator (blue icon)
  - User's email address
  - Username
  - Logout button
- Clicking the logout button terminates the session and redirects to the Home page

**Global Search Section**
- Provides comprehensive search functionality across the entire application
- Allows users to find projects, files, and anomalies using keywords
- Results are categorized for easy navigation

**Global Filter Section**
- Complements the search functionality with advanced filtering options
- Enables filtering by date ranges, file types, and other parameters
- Works similarly to the global search but with structured filtering criteria

**Settings Section**
- Contains application preferences and configuration options
- Allows users to toggle project active status
- Provides theme customization options
- Houses other system-wide settings

### Project Management Components

**Recent Projects Section**
- Displays recently created or accessed projects
- Organizes projects in a grid layout with 3 projects per row
- Shows a maximum of 12 projects for quick access
- Clicking any project opens its associated dashboard view with metadata

**Project List Section**
- Shows all projects ever created by the user
- Displays creation date and time for each project
- Includes a "See more" button for pagination when many projects exist
- Clicking any project opens it in the dashboard view

**Create Project Section**
- Opens a dedicated form for creating new projects
- Includes a selector for entity type (individual or company)
- Contains all required fields for project information
- Saving the form creates the project and immediately redirects to its dashboard

**Process Section**
- Provides quick access to file processing functionality
- Opens a dropdown menu of available projects
- Includes search functionality within the dropdown
- Selecting a project immediately opens its dashboard for processing

**Project Details Section**
- Allows users to view comprehensive project information
- Includes a project selector with search functionality
- Displays the complete company information entered during project creation
- Shows the same information visible in the create project form

### Document Management Components

**Files Section**
- Displays all processed and exported files across all projects
- Shows related files together (e.g., original PDF with its exported Excel file)
- Indicates which project each file belongs to
- Clicking a file opens its associated project in the dashboard view with metadata

**Anomaly Section**
- Lists all flagged anomalies across all projects
- Shows which project each anomaly is associated with
- Clicking an anomaly opens its associated project in the dashboard view
- Displays detailed information about the selected anomaly

## DASHBOARD (Dashboard.js)

The Dashboard is a project-specific interface that integrates with the OCR Engine and provides detailed project management capabilities.

### Project-Specific Controls

**Project-Specific Filter**
- Provides filtering functionality limited to the current project
- Allows users to filter files and anomalies within the project context
- Functions independently from the global filter

**Project-Specific Search**
- Enables searching within the current project only
- Searches across files, anomalies, and project data
- Provides focused results within the project context

### Document Processing Components

**File Upload Section**
- Offers drag-and-drop functionality for file uploads
- Includes a browse button for file selection
- Features "Process" and "Cancel" buttons below the upload area
- Initiates OCR processing when the Process button is clicked

**Progress Section**
- Displays a progress bar showing OCR processing status
- Tracks processing from 0% to 100% completion
- Updates in real-time during file processing

**Metadata Section**
- Located below the progress section
- Shows comprehensive information about processed files
- Displays extracted data and file details
- Appears once processing is completed

### Project Activity Components

**Recent Section**
- Shows a chronological list of recent activities within the project
- Displays both original files and their exported versions
- Includes timestamps for each activity
- Example: shows "pay.pdf" with "pay.xlsx" below it, along with date and time

**Download Section**
- Lists all exported files available for download
- Appears after processing is complete
- Shows exported files (e.g., pay.xlsx) that users can download
- Provides direct download links for each file



## MORE DETAILED WORKSPACE & DASHBOARD ARCHITECTURE

## WORKSPACE (Workspace.js)


### 1. Header Section

- **Global Search**: Search across all projects, files, and anomalies
  - Connects to `/api/search/` endpoint
  - Supports filtering by type (all, projects, files, anomalies)
  - Saves search history for quick access
- **Global Filter**: Advanced filtering options
  - Date range (from/to)
  - Vendor selection
  - File type selection
  - File size range
  - Uses `/api/filter-options/` to populate filter options dynamically
- **Profile Menu**: User profile dropdown
  - Active status indicator (blue icon)
  - Username display
  - Email display
  - Logout button (redirects to Home page)

### 2. Navigation Sidebar
- **Dashboard**: Opens the dashboard view for the selected project
- **Projects**: Submenu with:
  - Recent Projects
  - Project List
  - Create Project
- **Files**: Shows all processed and exported files
- **Anomalies**: Shows all flagged anomalies across projects
- **Process**: Quick access to file processing
- **Project Details**: Access to view and edit project information
- **Settings**: Application settings and preferences

### 3. Recent Projects Section
- Grid display showing 3 projects per row (max 12 projects)
- Each project card shows:
  - Company name
  - Creation date
  - Active/Inactive status
  - Quick access button to dashboard
- Clicking any project opens its dashboard view

### 4. Project List Section
- Complete list of all projects created by the user
- Sortable by date, name, or status
- Pagination with "See more" button
- Each project shows:
  - Company name
  - Business registration number
  - Creation date
  - Active/Inactive status
- Clicking any project opens its dashboard view

### 5. Files Section
- List of all processed and exported files across all projects
- Shows both original files and their exported versions together
- Each file entry displays:
  - File name
  - Associated project name
  - Processing date
  - File type (PDF, Excel, etc.)
  - File size
  - Download button
- Clicking a file opens its associated project in dashboard view
- Uses `/api/retrieve-files/` endpoint with filtering options

### 6. Anomalies Section
- List of all flagged anomalies across all projects
- Each anomaly shows:
  - Anomaly type
  - Description
  - Associated project
  - Detection date
  - Resolution status
  - Resolved by (if applicable)
- Clicking an anomaly opens its associated project in dashboard view
- Filter options for resolved/unresolved anomalies

### 7. Create Project Section
- Form to create a new project with fields:
  - Entity type selector (Individual/Company)
  - Company name
  - Business registration number
  - VAT registration number
  - Tax ID
  - Contact information
  - Address details
- Save button creates project and redirects to dashboard
- Connects to `/api/projects/` POST endpoint

### 8. Process Section
- Project selector dropdown (searchable)
- Selecting a project redirects to that project's dashboard
- Quick access to start processing files for a specific project

### 9. Project Details Section
- Project selector dropdown (searchable)
- Displays the complete project information:
  - Company details
  - Registration information
  - Contact details
  - Creation date
  - Last modified date
- Edit button to modify project details
- Toggle button to activate/deactivate project
- Connects to `/api/projects/<id>/` endpoints

### 10. Settings Section
- Theme preferences (Light/Dark mode)
- Notification settings
- Account settings
- Project display preferences
- Toggle project active status

## DASHBOARD (Dashboard.js)

The Dashboard is a project-specific view that integrates with the OCR Engine and displays all project-related information.

### 1. Project Header
- Project name and ID
- Active/Inactive status indicator
- Last accessed timestamp
- Back button to workspace

### 2. Control Panel
- **Project-specific Search**: Search within the current project
  - Connects to `/api/projects/<id>/search/` endpoint
  - Searches files and anomalies within the project
- **Project-specific Filter**: Filter options for the current project
  - Date range
  - Vendor
  - File type
  - File size
- **View Selector**: Toggle between different dashboard views
  - Files view
  - Anomalies view
  - History view

### 3. File Upload Section
- Drag and drop area or browse button
- File type restrictions (PDF, images)
- Multiple file selection support
- Process button to start OCR processing
- Cancel button to abort upload
- Connects to `/api/projects/<id>/process-invoices/` endpoint

### 4. Processing Progress Section
- Progress bar showing OCR processing status (0-100%)
- Status message (Queued, Processing, Completed, Failed)
- Cancel processing button
- Connects to `/api/projects/<id>/ocr-status/<task_id>/` endpoint for updates

### 5. Recent Activities Section
- Timeline of recent actions within the project
- Shows both original files and their exported versions
- Each entry displays:
  - File name
  - Action type (process, export, download)
  - Timestamp
  - User who performed the action
- Connects to project history data

### 6. Files View
- List of all files processed within the project
- Each file shows:
  - File name
  - Processing date
  - File type
  - File size
  - Vendor name (if extracted)
  - Invoice number (if extracted)
  - Download button
- Sorting options (by date, name, type)
- Connects to `/api/projects/<id>/files/` endpoint

### 7. Download Section
- List of exported files available for download
- Each file shows:
  - File name
  - Export date
  - File type (Excel, CSV)
  - File size
  - Download button
- Connects to `/api/projects/<id>/files/<file_id>/download/` endpoint

### 8. Metadata Section
- Detailed information about the selected processed file:
  - Original filename
  - Processed date
  - File size
  - Extracted data:
    - Vendor name
    - Invoice number
    - Invoice date
    - Total amount
    - Tax amount
    - Line items (if available)
  - Processing status
  - OCR confidence score

### 9. Anomalies View
- List of anomalies detected within the project
- Each anomaly shows:
  - Anomaly type
  - Description
  - Detection date
  - Associated file
  - Resolution status
  - Resolve button (for unresolved anomalies)
- Filter for resolved/unresolved anomalies
- Connects to `/api/projects/<id>/anomalies/` endpoint

### 10. Project History View
- Complete audit trail of all actions within the project
- Each entry shows:
  - Action type
  - Description
  - Timestamp
  - User who performed the action
  - Associated file (if applicable)
- Filter options by action type and date range

