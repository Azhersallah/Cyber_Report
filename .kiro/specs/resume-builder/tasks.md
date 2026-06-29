# Implementation Plan: Resume Builder

## Overview

This implementation plan breaks down the Resume Builder feature into discrete, incremental tasks. Each task builds upon previous work, ensuring the feature develops systematically from data models through UI components to final integration and testing.

## Tasks

- [x] 1. Set up data models and type definitions
  - Create TypeScript interfaces for ResumeData, PersonalInfo, WorkExperience, Education, CustomSection
  - Create TypeScript interfaces for ResumeTemplate, ColorScheme, CustomizationOptions
  - Add resume-related types to types.ts file
  - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 9.1_

- [x]* 1.1 Write property test for data serialization
  - **Property 1: Resume data persistence round-trip**
  - **Validates: Requirements 9.3, 9.4**

- [x] 2. Extend AppContext with resume state
  - [x] 2.1 Add resume mode to AppState
    - Add 'resume' to mode type union
    - Add resumeData, selectedResumeTemplate, resumeCustomization to AppState
    - Initialize default resume state values
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Implement resume-related actions and reducers
    - Add UPDATE_RESUME_DATA action and reducer logic
    - Add SET_RESUME_TEMPLATE action and reducer logic
    - Add UPDATE_RESUME_CUSTOMIZATION action and reducer logic
    - Add LOAD_RESUME_FROM_STORAGE action and reducer logic
    - _Requirements: 1.3, 2.1, 9.2, 13.3_

  - [x]* 2.3 Write property test for template switching
    - **Property 2: Template switching preserves data**
    - **Validates: Requirements 2.3**

- [x] 3. Implement local storage persistence for resume data
  - Add resume data save function to local storage
  - Add resume data load function from local storage
  - Integrate auto-save on resume data changes
  - Integrate auto-load on application start
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 4. Create PhotoUploader component
  - [x] 4.1 Implement photo upload UI
    - **USE shadcn/ui Button component** for upload/remove buttons
    - **USE shadcn/ui Card component** for photo preview
    - Create PhotoUploader component with file input
    - Add photo preview display
    - Add remove photo button
    - Follow existing photo upload patterns from PhotoGrid
    - _Requirements: 7.1, 7.3, 14.1, 14.2_

  - [x] 4.2 Implement photo processing logic
    - Add HEIC to JPEG conversion using heic2any
    - Add image resizing to fit template specifications
    - Add base64 encoding for storage
    - Maintain aspect ratio during resize
    - _Requirements: 7.1, 7.2, 7.4_

  - [x]* 4.3 Write property test for photo upload
    - **Property 3: Photo upload format conversion**
    - **Validates: Requirements 7.1, 7.4**

  - [x]* 4.4 Write property test for aspect ratio preservation
    - **Property 11: Photo aspect ratio preservation**
    - **Validates: Requirements 7.4**

- [x] 5. Create ResumeEditor component
  - [x] 5.1 Implement personal information form
    - **USE shadcn/ui Input component** for all text fields
    - **USE shadcn/ui Textarea** for summary field
    - Create input fields for name, title, phone, email, address
    - Add optional fields for LinkedIn, website, summary
    - Implement real-time validation for email format
    - Apply RTL styling for Kurdish language using existing patterns
    - _Requirements: 3.1, 3.2, 3.3, 11.1, 11.2, 14.1, 14.2_

  - [x] 5.2 Implement work experience section
    - **USE shadcn/ui Card component** for each entry
    - **USE shadcn/ui Button component** for add/remove actions
    - **USE shadcn/ui Input and Textarea** for form fields
    - Create form for adding work experience entries
    - Add fields for job title, company, location, dates, description
    - Implement add/remove/reorder functionality
    - Generate unique IDs for each entry
    - _Requirements: 4.1, 4.3, 4.4, 14.1, 14.2_

  - [x]* 5.3 Write property test for work experience ordering
    - **Property 4: Work experience chronological ordering**
    - **Validates: Requirements 4.2**

  - [x] 5.4 Implement education section
    - **USE shadcn/ui Card component** for each entry
    - **USE shadcn/ui Button component** for add/remove actions
    - **USE shadcn/ui Input and Textarea** for form fields
    - Create form for adding education entries
    - Add fields for degree, institution, location, dates, GPA, honors
    - Implement add/remove/reorder functionality
    - Generate unique IDs for each entry
    - _Requirements: 5.1, 5.3, 5.4, 14.1, 14.2_

  - [x]* 5.5 Write property test for education ordering
    - **Property 5: Education chronological ordering**
    - **Validates: Requirements 5.2**

  - [x] 5.6 Implement skills section
    - **USE shadcn/ui Badge component** to display skills
    - **USE shadcn/ui Input component** for adding new skills
    - **USE shadcn/ui Button component** for add/remove actions
    - Create input for adding skills
    - Implement add/remove functionality for skills
    - Display skills as tags using Badge component
    - _Requirements: 6.1, 6.2, 14.1, 14.2_

  - [x] 5.7 Integrate PhotoUploader into ResumeEditor
    - Add PhotoUploader component to editor
    - Connect photo upload to resume data state
    - _Requirements: 7.1, 7.2, 7.3_

  - [x]* 5.8 Write property test for real-time updates
    - **Property 6: Real-time update consistency**
    - **Validates: Requirements 8.1, 8.2**

- [x] 6. Create Template 1: Professional
  - [x] 6.1 Implement template layout structure
    - **USE Tailwind CSS exclusively** - No custom CSS files
    - **USE existing color variables** (--primary, --accent, --text, etc.)
    - Create ProfessionalTemplate component
    - Implement two-column layout using CSS Grid
    - Position photo in top-right corner
    - Add accent color for section headers using existing variables
    - _Requirements: 2.1, 2.2, 14.3, 14.4_

  - [x] 6.2 Implement template sections
    - **USE Tailwind utility classes** for all styling
    - Create PersonalInfoSection component
    - Create WorkExperienceSection component
    - Create EducationSection component
    - Create SkillsSection component
    - Render sections with resume data
    - _Requirements: 3.1, 4.2, 5.2, 6.3, 14.3_

  - [x] 6.3 Apply Kurdish language support
    - Apply RTL text direction for Kurdish content using existing patterns
    - Use Noto Kufi Arabic font (font-kufi class)
    - Handle bidirectional text correctly
    - _Requirements: 11.1, 11.2, 11.3_

  - [x]* 6.4 Write property test for Kurdish RTL rendering
    - **Property 7: Kurdish text RTL rendering**
    - **Validates: Requirements 11.1, 11.2**

  - [x] 6.5 Implement responsive layout
    - Add dynamic section height adjustment
    - Implement multi-page support for overflow content
    - Maintain consistent spacing and alignment
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x]* 6.6 Write property test for multi-page content
    - **Property 8: Multi-page content distribution**
    - **Validates: Requirements 4.5, 12.2**

  - [x]* 6.7 Write property test for skills formatting
    - **Property 10: Skills list formatting**
    - **Validates: Requirements 6.3, 6.4**

  - [x]* 6.8 Write property test for empty state handling
    - **Property 12: Empty state handling**
    - **Validates: Requirements 8.4**

- [x] 7. Create Template 2: Classic
  - [x] 7.1 Implement classic template layout
    - **USE Tailwind CSS exclusively** - No custom CSS files
    - **USE existing color variables**
    - Create ClassicTemplate component
    - Implement single-column layout
    - Position photo in top-left corner
    - Apply conservative styling
    - _Requirements: 2.1, 2.2, 14.3, 14.4_

  - [x] 7.2 Reuse section components from Template 1
    - Import and use PersonalInfoSection, WorkExperienceSection, etc.
    - Adjust styling for classic design using Tailwind classes
    - _Requirements: 3.1, 4.2, 5.2, 6.3, 14.3_

  - [x] 7.3 Apply Kurdish language support
    - Apply RTL and font styling for Kurdish using existing patterns
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 8. Create Template 3: Modern
  - [x] 8.1 Implement modern template layout
    - **USE Tailwind CSS exclusively** - No custom CSS files
    - **USE existing color variables**
    - Create ModernTemplate component
    - Implement mixed column layout
    - Integrate photo into header
    - Apply bold typography
    - _Requirements: 2.1, 2.2, 14.3, 14.4_

  - [x] 8.2 Reuse section components
    - Import and use section components
    - Adjust styling for modern design using Tailwind classes
    - _Requirements: 3.1, 4.2, 5.2, 6.3, 14.3_

  - [x] 8.3 Apply Kurdish language support
    - Apply RTL and font styling for Kurdish using existing patterns
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 9. Create TemplateSelector component
  - **USE shadcn/ui Dialog component** for modal display
  - **USE shadcn/ui Card component** for template previews
  - **USE shadcn/ui Button component** for selection
  - Create TemplateSelector UI component
  - Display template thumbnails with previews in grid layout
  - Implement template selection handler
  - Connect to AppContext for template state
  - _Requirements: 2.1, 2.2, 2.4, 14.1, 14.2_

- [x] 10. Create ResumeCanvas component
  - [x] 10.1 Implement canvas container
    - Create ResumeCanvas component
    - Render selected template with resume data
    - Apply zoom transformation
    - Handle viewport and scrolling
    - _Requirements: 1.1, 8.1, 8.2, 8.3_

  - [x] 10.2 Integrate with print system
    - Connect to existing print infrastructure
    - Apply A4 page formatting
    - Handle multi-page printing
    - Maintain template design in print output
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x]* 10.3 Write property test for print fidelity
    - **Property 9: Print output fidelity**
    - **Validates: Requirements 10.2**

- [x] 11. Integrate Resume mode into Sidebar
  - Add Resume icon to Sidebar component
  - Add Resume navigation option
  - Implement mode switching to 'resume'
  - Apply activation check for resume mode
  - _Requirements: 1.1, 1.2_

- [x] 12. Integrate Resume mode into main App
  - [x] 12.1 Add resume mode rendering to MainContent
    - Add conditional rendering for resume mode
    - Render ResumeCanvas when mode is 'resume'
    - Render ResumeEditor in sidebar or panel
    - _Requirements: 1.1, 1.2_

  - [x] 12.2 Add resume-specific toolbar options
    - Add template selector to toolbar
    - Add customization options (if implemented)
    - _Requirements: 2.1, 13.1, 13.2_

- [x] 13. Implement template customization (optional)
  - [x] 13.1 Add color customization UI
    - Create color picker component
    - Allow primary and accent color changes
    - Apply colors to template in real-time
    - _Requirements: 13.1, 13.3_

  - [x] 13.2 Add font customization UI
    - Create font selector component
    - Provide list of professional fonts
    - Apply font changes to template in real-time
    - _Requirements: 13.2, 13.3_

  - [x] 13.3 Preserve customization on template switch
    - Store customization preferences
    - Apply preferences when switching templates
    - _Requirements: 13.4_

- [x] 14. Add input validation and error handling
  - Implement email format validation
  - Implement date validation (end after start)
  - Add photo size limit check (10MB)
  - Add error messages for validation failures
  - Handle storage quota exceeded errors
  - _Requirements: 3.1, 4.1, 5.1, 7.1_

- [x] 15. Write unit tests for edge cases
  - Test email validation with various formats
  - Test date validation with edge cases
  - Test photo upload with invalid files
  - Test empty resume data rendering
  - Test long text handling and truncation

- [x] 16. Final integration and testing
  - Test complete workflow: create resume, edit, print
  - Test mode switching between photo/businesscard/invoice/resume
  - Test data persistence across app restarts
  - Test Kurdish language support end-to-end
  - Verify print output quality and formatting
  - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2, 10.1, 10.2, 11.4_

- [x] 17. Checkpoint - Ensure all tests pass
  - All 81 tests passing successfully

- [x] 18. Add clear resume button and ensure project save includes resume data
  - [x] 18.1 Add CLEAR_RESUME_DATA action to AppContext reducer
    - Add action type to Action union
    - Implement reducer case to reset resume data to initial empty state
    - _Requirements: 9.1, 9.2_
  
  - [x] 18.2 Add clear button to Resume sidebar with nice confirmation dialog
    - **USE shadcn/ui Button component** for clear button
    - **USE shadcn/ui Card component** for confirmation dialog
    - Add Trash2 icon from lucide-react
    - Implement portal-based modal dialog matching existing patterns
    - Add translations for confirmation title and description
    - Support Kurdish and English languages with RTL support
    - Position button below resume section navigation
    - Use destructive variant for clear action
    - _Requirements: 1.1, 11.1, 14.1, 14.2_
  
  - [x] 18.3 Verify resume data is saved in project files
    - Confirm resume data is part of AppState
    - Verify project save includes resumeData
    - Confirm resume data persists in .pppro files
    - _Requirements: 9.1, 9.3, 9.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Template customization (Task 13) is marked as optional but can be implemented for enhanced user experience
- The implementation follows an incremental approach: data models → state management → components → templates → integration
- **CRITICAL**: All UI components MUST use shadcn/ui components (Button, Card, Input, Tabs, Badge, Dialog)
- **CRITICAL**: All styling MUST use Tailwind CSS utility classes - NO custom CSS files
- **CRITICAL**: All colors MUST use existing CSS variables (--primary, --border, etc.)
- **CRITICAL**: Follow existing patterns from PhotoGrid, Layout, and Modals components
