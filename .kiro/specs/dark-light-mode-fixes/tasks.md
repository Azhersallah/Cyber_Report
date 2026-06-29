# Implementation Plan

- [x] 1. Update global styles and Tailwind configuration
  - [x] 1.1 Update index.html to add Kurdish font class application logic
    - Add conditional `font-kufi` class to body when Kurdish language is active
    - Ensure Noto Kufi Arabic font is properly loaded from Google Fonts
    - _Requirements: 4.1, 4.2_
  - [x] 1.2 Add smooth transition utilities to global CSS
    - Add transition classes for theme changes
    - Add `will-change` hints for performance
    - _Requirements: 5.1, 5.3_
  - [x] 1.3 Update print styles to hide hover effects
    - Add CSS rules to hide hover state elements during print
    - Ensure `.no-print` class hides all UI overlays
    - Verify paper dimensions are preserved in print media query
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3_

- [x] 2. Fix dark mode colors in Header component
  - [x] 2.1 Audit and fix Header.tsx dark mode classes
    - Review all color classes and add missing `dark:` variants
    - Ensure buttons, inputs, and text have proper dark mode colors
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Fix dark mode colors in Sidebar component
  - [x] 3.1 Audit and fix Sidebar.tsx dark mode classes
    - Review all color classes and add missing `dark:` variants
    - Fix section headers, buttons, and input styling
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Fix dark mode colors in PhotoGrid components
  - [x] 4.1 Update PhotoPage.tsx for theme consistency
    - Ensure paper content stays white with dark text
    - Fix any dark mode color leaks into paper area
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 4.2 Update PhotoSlot.tsx for theme consistency
    - Ensure slot backgrounds stay white on paper
    - Fix hover effects to not show during print
    - _Requirements: 2.1, 2.2, 3.1_

- [x] 5. Fix dark mode colors in Modal components


  - [x] 5.1 Update PrintModal.tsx dark mode classes


    - Add missing dark mode color variants
    - _Requirements: 1.1, 1.2_
  - [x] 5.2 Update ConfirmModal.tsx dark mode classes


    - Add missing dark mode color variants
    - _Requirements: 1.1, 1.2_

- [x] 6. Fix dark mode colors in Editor components


  - [x] 6.1 Update ImageEditor.tsx dark mode classes


    - Add missing dark mode color variants
    - _Requirements: 1.1, 1.2_
  - [x] 6.2 Update TextFormattingToolbar.tsx dark mode classes


    - Add missing dark mode color variants
    - _Requirements: 1.1, 1.2_

- [x] 7. Apply Kurdish font to App component


  - [x] 7.1 Update App.tsx to apply font-kufi class conditionally


    - Add logic to apply `font-kufi` class when language is Kurdish
    - Ensure font applies to all UI elements outside paper
    - _Requirements: 4.1, 4.3_

- [x] 8. Fix RTL layout for Kurdish language


  - [x] 8.1 Move floating zoom controls to left side in Kurdish mode


    - Update FloatingZoomControls in App.tsx to use `left-8` instead of `right-8` when language is Kurdish
    - _Requirements: 7.1, 7.2_
  - [x] 8.2 Fix settings dialog positioning in Kurdish mode


    - Update Header.tsx settings dropdown to position from left instead of right when Kurdish
    - Ensure dialog stays within viewport bounds
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 9. Checkpoint - Verify all changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9.1 Write property test for Kurdish font application
  - **Property 1: Kurdish language applies Kufi font**
  - **Validates: Requirements 4.1**
