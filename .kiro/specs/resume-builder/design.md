# Design Document: Resume Builder

## Overview

The Resume Builder feature extends Photo Printer Pro with professional resume creation capabilities. It integrates as a new mode alongside existing modes (photo, businesscard, invoice, idphoto), providing users with template-based resume creation, real-time editing, and high-quality printing.

The system follows the existing application architecture, utilizing React for UI components, local storage for data persistence, and the established printing infrastructure. The design emphasizes professional output quality, Kurdish language support, and seamless integration with the existing codebase.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sidebar    │  │    Header    │  │   Toolbar    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Resume Builder Mode                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Resume Canvas Component                  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Template Renderer                      │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │   │
│  │  │  │Template 1│  │Template 2│  │Template 3│    │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘    │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Resume Editor Component                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │  Personal  │  │    Work    │  │ Education  │    │   │
│  │  │    Info    │  │ Experience │  │            │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  │  ┌────────────┐  ┌────────────┐                    │   │
│  │  │   Skills   │  │   Photo    │                    │   │
│  │  └────────────┘  └────────────┘                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AppContext (State Management)            │   │
│  │  - resumeData: ResumeData                            │   │
│  │  - selectedTemplate: string                          │   │
│  │  - resumeCustomization: CustomizationOptions         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Local Storage Persistence                │   │
│  │  - Save/Load resume data                             │   │
│  │  - Template preferences                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Print/Export Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Print Engine                             │   │
│  │  - A4 page formatting                                │   │
│  │  - Multi-page support                                │   │
│  │  - Font rendering (Kurdish support)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Integration with Existing Architecture

The Resume Builder integrates with the existing application structure:

1. **Mode System**: Adds 'resume' as a new mode in AppContext alongside 'photo', 'businesscard', 'invoice', 'idphoto'
2. **Sidebar Integration**: Adds Resume icon and navigation option
3. **State Management**: Extends AppContext with resume-specific state
4. **Print System**: Utilizes existing print infrastructure with resume-specific formatting
5. **Storage**: Uses existing local storage patterns for data persistence

## Components and Interfaces

### Design System Integration

**CRITICAL**: All Resume Builder components MUST use the existing design system to maintain visual consistency with the rest of the application:

- **UI Components**: Use shadcn/ui components (Button, Card, Input, Tabs, Badge, Dialog)
- **Styling**: Use Tailwind CSS with existing design tokens from `index.css`
- **Typography**: Use existing font families (Inter for English, Noto Kufi Arabic for Kurdish)
- **Colors**: Use CSS variables (--background, --foreground, --primary, --border, etc.)
- **Spacing**: Follow existing spacing patterns (p-4, gap-2, etc.)
- **Patterns**: Follow existing component patterns from other modes (PhotoGrid, Layout, Modals)

### 1. ResumeCanvas Component

**Purpose**: Main container for displaying the resume preview

**Props**:
```typescript
interface ResumeCanvasProps {
  // No props needed - uses AppContext
}
```

**Implementation Details**:
- Uses `useApp()` hook to access state
- Renders selected template component
- Applies zoom transformation using `state.zoom`
- Uses existing A4 page styling classes
- Wraps template in print-ready container

**Styling**:
- Container: `flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30 flex justify-center`
- Page wrapper: `relative transition-transform duration-200 ease-out shadow-lg`
- Uses existing print CSS classes

### 2. ResumeEditor Component

**Purpose**: Tabbed sidebar panel for editing resume content

**Props**:
```typescript
interface ResumeEditorProps {
  // No props needed - uses AppContext
}
```

**Implementation Details**:
- Uses shadcn/ui **Tabs** component for section navigation
- Each tab contains a form component (PersonalInfoForm, WorkExperienceForm, etc.)
- Uses `useApp()` hook for state management
- Follows existing sidebar patterns from other modes

**Styling**:
- Container: `h-full flex flex-col bg-background`
- Tab list: `border-b border-border`
- Tab trigger: Uses existing button styling patterns
- Content area: `flex-1 overflow-y-auto p-6`

**Tabs Structure**:
```typescript
<Tabs defaultValue="personal">
  <TabsList>
    <TabsTrigger value="personal">
      <User size={16} />
      {isRTL ? 'زانیاری کەسی' : 'Personal Info'}
    </TabsTrigger>
    {/* Other tabs */}
  </TabsList>
  <TabsContent value="personal">
    <PersonalInfoForm />
  </TabsContent>
</Tabs>
```

### 3. PersonalInfoForm Component

**Purpose**: Form for editing personal information

**Props**:
```typescript
interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: Partial<PersonalInfo>) => void;
  language: 'en' | 'ku' | 'ar';
}
```

**Implementation Details**:
- Uses shadcn/ui **Input** component for all text fields
- Uses shadcn/ui **Textarea** for summary field
- Implements inline validation with error states
- Follows existing form patterns from other components

**Styling**:
- Form container: `space-y-4`
- Label: `block text-sm font-medium mb-1`
- Input: Uses shadcn/ui Input component with existing styling
- Error message: `text-xs text-destructive mt-1`

### 4. WorkExperienceForm Component

**Purpose**: Form for managing work experience entries

**Props**:
```typescript
interface WorkExperienceFormProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
  language: 'en' | 'ku' | 'ar';
}
```

**Implementation Details**:
- Uses shadcn/ui **Card** component for each entry
- Uses shadcn/ui **Button** for add/remove actions
- Uses shadcn/ui **Input** for text fields
- Uses shadcn/ui **Textarea** for descriptions
- Implements drag-and-drop reordering (optional)

**Styling**:
- Entry card: Uses shadcn/ui Card with `mb-4`
- Add button: `<Button variant="outline">` with Plus icon
- Remove button: `<Button variant="ghost" size="icon">` with Trash icon

### 5. EducationForm Component

**Purpose**: Form for managing education entries

**Props**:
```typescript
interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
  language: 'en' | 'ku' | 'ar';
}
```

**Implementation Details**:
- Same pattern as WorkExperienceForm
- Uses shadcn/ui components (Card, Button, Input)
- Follows existing form patterns

### 6. SkillsForm Component

**Purpose**: Form for managing skills list

**Props**:
```typescript
interface SkillsFormProps {
  data: string[];
  onChange: (data: string[]) => void;
  language: 'en' | 'ku' | 'ar';
}
```

**Implementation Details**:
- Uses shadcn/ui **Badge** component to display skills
- Uses shadcn/ui **Input** for adding new skills
- Uses shadcn/ui **Button** for add/remove actions
- Implements tag-style interface

**Styling**:
- Skills container: `flex flex-wrap gap-2`
- Skill badge: `<Badge variant="secondary">` with X button
- Add input: Uses shadcn/ui Input component

### 7. PhotoUploader Component

**Purpose**: Handle resume photo uploads

**Props**:
```typescript
interface PhotoUploaderProps {
  currentPhoto: string | null;
  onPhotoChange: (photo: string) => void;
  onPhotoRemove: () => void;
  language: 'en' | 'ku' | 'ar';
}
```

**Implementation Details**:
- Uses shadcn/ui **Button** for upload/remove actions
- Uses shadcn/ui **Card** for photo preview
- Follows existing photo upload patterns from PhotoGrid
- Implements drag-and-drop upload

**Styling**:
- Container: `space-y-4`
- Preview card: Uses shadcn/ui Card
- Upload button: `<Button variant="outline">` with Camera icon
- Remove button: `<Button variant="destructive" size="sm">`

### 8. TemplateSelector Component

**Purpose**: UI for choosing resume templates

**Props**:
```typescript
interface TemplateSelectorProps {
  // No props needed - uses AppContext
}
```

**Implementation Details**:
- Uses shadcn/ui **Dialog** for modal display
- Uses shadcn/ui **Card** for template previews
- Uses shadcn/ui **Button** for selection
- Displays template thumbnails in grid layout

**Styling**:
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Template card: Uses shadcn/ui Card with hover effects
- Selected state: `ring-2 ring-primary`

### 9. Template Components

Each template is a separate React component that receives resume data and renders it according to its design:

**Template 1: Professional**
- Clean, modern layout
- Photo on top-right
- Two-column design for skills and experience
- Accent color for headers

**Template 2: Classic**
- Traditional layout
- Photo on top-left
- Single-column design
- Conservative styling

**Template 3: Modern**
- Contemporary design
- Photo integrated into header
- Mixed column layout
- Bold typography

**Common Template Interface**:
```typescript
interface TemplateProps {
  data: ResumeData;
  customization: CustomizationOptions;
  language: 'en' | 'ku' | 'ar';
}
```

**Template Styling**:
- All templates use Tailwind CSS
- All templates use existing color variables
- All templates support print media queries
- All templates handle RTL for Kurdish text

## Data Models

### ResumeData

```typescript
interface ResumeData {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  photo: string | null; // Base64 encoded image
  customSections?: CustomSection[];
}

interface PersonalInfo {
  fullName: string;
  title: string; // Professional title/headline
  phone: string;
  email: string;
  address: string;
  linkedin?: string;
  website?: string;
  summary?: string; // Professional summary/objective
}

interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string; // Format: "YYYY-MM"
  endDate: string | 'present';
  description: string;
  highlights?: string[]; // Bullet points
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string | 'present';
  gpa?: string;
  honors?: string;
  description?: string;
}

interface CustomSection {
  id: string;
  title: string;
  content: string;
}
```

### ResumeTemplate

```typescript
interface ResumeTemplate {
  id: string;
  name: string;
  thumbnail: string; // Preview image
  component: React.ComponentType<TemplateProps>;
  defaultColors: ColorScheme;
  supportedCustomizations: string[]; // e.g., ['colors', 'fonts']
}

interface ColorScheme {
  primary: string;
  accent: string;
  text: string;
  background: string;
  secondary: string;
}
```

### CustomizationOptions

```typescript
interface CustomizationOptions {
  colors?: Partial<ColorScheme>;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  spacing?: 'compact' | 'normal' | 'relaxed';
}
```

### AppContext Extensions

```typescript
// Add to existing AppState interface
interface AppState {
  // ... existing fields
  mode: 'photo' | 'businesscard' | 'invoice' | 'idphoto' | 'resume';
  resumeData: ResumeData;
  selectedResumeTemplate: string;
  resumeCustomization: CustomizationOptions;
}

// Add to existing Action types
type Action =
  | { type: 'SET_MODE'; payload: AppState['mode'] }
  | { type: 'UPDATE_RESUME_DATA'; payload: Partial<ResumeData> }
  | { type: 'SET_RESUME_TEMPLATE'; payload: string }
  | { type: 'UPDATE_RESUME_CUSTOMIZATION'; payload: Partial<CustomizationOptions> }
  | { type: 'LOAD_RESUME_FROM_STORAGE'; payload: ResumeData }
  // ... existing actions
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Resume data persistence round-trip

*For any* valid ResumeData object, serializing it to JSON, saving to local storage, loading from local storage, and deserializing should produce an equivalent ResumeData object with all fields preserved.

**Validates: Requirements 9.3, 9.4**

### Property 2: Template switching preserves data

*For any* ResumeData and any two templates, switching from template A to template B and then rendering should display all resume data fields that were present before the switch.

**Validates: Requirements 2.3**

### Property 3: Photo upload format conversion

*For any* valid image file in JPEG, PNG, or HEIC format, uploading it should result in a valid base64-encoded image string that can be rendered in the resume canvas.

**Validates: Requirements 7.1, 7.4**

### Property 4: Work experience chronological ordering

*For any* list of work experience entries with valid dates, the rendered resume should display them in reverse chronological order (most recent first).

**Validates: Requirements 4.2**

### Property 5: Education chronological ordering

*For any* list of education entries with valid dates, the rendered resume should display them in reverse chronological order (most recent first).

**Validates: Requirements 5.2**

### Property 6: Real-time update consistency

*For any* resume data field update, the change should be reflected in the canvas within 100ms and the updated data should match the input value exactly.

**Validates: Requirements 8.1, 8.2**

### Property 7: Kurdish text RTL rendering

*For any* text input containing Kurdish characters, the rendered output should apply RTL text direction and use the Noto Kufi Arabic font.

**Validates: Requirements 11.1, 11.2**

### Property 8: Multi-page content distribution

*For any* resume content that exceeds one A4 page height, the system should create additional pages such that no content is clipped or hidden.

**Validates: Requirements 4.5, 12.2**

### Property 9: Print output fidelity

*For any* resume displayed in the canvas, the printed output should match the canvas display exactly in terms of layout, fonts, colors, and content.

**Validates: Requirements 10.2**

### Property 10: Skills list formatting

*For any* list of skills, regardless of length, all skills should be visible in the resume display with appropriate formatting according to the template design.

**Validates: Requirements 6.3, 6.4**

### Property 11: Photo aspect ratio preservation

*For any* uploaded photo, the displayed photo in the resume should maintain the original aspect ratio without distortion.

**Validates: Requirements 7.4**

### Property 12: Empty state handling

*For any* resume section (work experience, education, skills) that has zero entries, the resume should render without errors and display the section header appropriately or hide the section based on template design.

**Validates: Requirements 8.4**

## Error Handling

### Input Validation

1. **Email Validation**: Validate email format using regex pattern
2. **Date Validation**: Ensure dates are in correct format and logical (end date after start date)
3. **Required Fields**: Validate that minimum required fields (name) are present before allowing print
4. **Photo Size Limits**: Reject photos larger than 10MB
5. **Text Length Limits**: Warn users when text exceeds recommended lengths for optimal layout

### Error States

1. **Photo Upload Failures**: Display error message and allow retry
2. **Storage Quota Exceeded**: Notify user and suggest clearing old data
3. **Invalid Data Load**: Fall back to empty resume state if stored data is corrupted
4. **Print Failures**: Show error dialog with troubleshooting steps

### Graceful Degradation

1. **Missing Photo**: Display placeholder or hide photo section
2. **Long Text**: Automatically adjust font size or truncate with ellipsis
3. **Unsupported Fonts**: Fall back to system fonts if custom fonts fail to load

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Data Validation**: Test email validation, date validation, required fields
2. **Component Rendering**: Test that each template component renders without errors
3. **Photo Processing**: Test HEIC conversion, image resizing, base64 encoding
4. **Date Formatting**: Test various date formats and edge cases (present, invalid dates)
5. **Storage Operations**: Test save/load with valid and invalid data
6. **RTL Text Handling**: Test Kurdish text rendering with mixed content

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using a PBT library (fast-check for TypeScript). Each test will run a minimum of 100 iterations.

1. **Property 1 Test**: Generate random ResumeData objects, serialize/deserialize, verify equality
   - **Tag**: Feature: resume-builder, Property 1: Resume data persistence round-trip

2. **Property 2 Test**: Generate random ResumeData, switch between random templates, verify data preservation
   - **Tag**: Feature: resume-builder, Property 2: Template switching preserves data

3. **Property 3 Test**: Generate random image data in different formats, verify conversion success
   - **Tag**: Feature: resume-builder, Property 3: Photo upload format conversion

4. **Property 4 Test**: Generate random work experience lists with random dates, verify chronological order
   - **Tag**: Feature: resume-builder, Property 4: Work experience chronological ordering

5. **Property 5 Test**: Generate random education lists with random dates, verify chronological order
   - **Tag**: Feature: resume-builder, Property 5: Education chronological ordering

6. **Property 6 Test**: Generate random field updates, measure update time, verify value consistency
   - **Tag**: Feature: resume-builder, Property 6: Real-time update consistency

7. **Property 7 Test**: Generate random Kurdish text strings, verify RTL and font application
   - **Tag**: Feature: resume-builder, Property 7: Kurdish text RTL rendering

8. **Property 8 Test**: Generate resume content of varying lengths, verify page creation
   - **Tag**: Feature: resume-builder, Property 8: Multi-page content distribution

9. **Property 9 Test**: Generate random resume data, render and print, verify output matches
   - **Tag**: Feature: resume-builder, Property 9: Print output fidelity

10. **Property 10 Test**: Generate skill lists of varying lengths, verify all skills visible
    - **Tag**: Feature: resume-builder, Property 10: Skills list formatting

11. **Property 11 Test**: Generate images with various aspect ratios, verify preservation
    - **Tag**: Feature: resume-builder, Property 11: Photo aspect ratio preservation

12. **Property 12 Test**: Generate resume data with empty sections, verify error-free rendering
    - **Tag**: Feature: resume-builder, Property 12: Empty state handling

### Integration Tests

1. **Mode Switching**: Test switching between resume mode and other modes
2. **Print Workflow**: Test complete print workflow from edit to print output
3. **Template Switching**: Test switching templates with populated data
4. **Photo Upload Flow**: Test complete photo upload and display workflow
5. **Data Persistence**: Test save/load across application restarts

### Testing Tools

- **Unit Testing**: Jest + React Testing Library
- **Property-Based Testing**: fast-check (TypeScript PBT library)
- **Integration Testing**: Playwright or Cypress for E2E tests
- **Visual Regression**: Percy or Chromatic for template rendering verification

## Implementation Notes

### Design System Compliance

**CRITICAL RULES**:
1. **NO custom CSS classes** - Use only Tailwind utility classes
2. **NO inline styles** except for dynamic values (zoom, transforms)
3. **USE shadcn/ui components** - Do not create custom button/input/card components
4. **FOLLOW existing patterns** - Look at PhotoGrid, Layout, Modals for reference
5. **USE design tokens** - Always use CSS variables (--primary, --border, etc.)
6. **MAINTAIN consistency** - Resume mode should feel like part of the same app

### Component Reuse Strategy

**Reuse from existing codebase**:
- Button component: `components/ui/button.tsx`
- Card component: `components/ui/card.tsx`
- Input component: `components/ui/input.tsx`
- Tabs component: `components/ui/tabs.tsx`
- Badge component: `components/ui/badge.tsx`
- Dialog component: `components/ui/dialog.tsx`

**Create new components only for**:
- Resume-specific forms (PersonalInfoForm, WorkExperienceForm, etc.)
- Template renderers (ProfessionalTemplate, ClassicTemplate, ModernTemplate)
- Resume-specific layouts (ResumeCanvas, ResumeEditor)

### Template Implementation Strategy

1. Start with one template (Professional) to establish the pattern
2. Create reusable section components (PersonalInfoSection, WorkExperienceSection, etc.)
3. Implement remaining templates by composing section components with different layouts
4. Use CSS Grid and Flexbox for responsive layouts
5. **Use Tailwind classes exclusively** - No custom CSS files for templates
6. **Use existing color variables** - Maintain theme consistency

### Styling Guidelines

**Form Inputs**:
```tsx
// ✅ CORRECT - Uses shadcn/ui Input
<Input
  type="text"
  value={data.fullName}
  onChange={(e) => handleChange('fullName', e.target.value)}
  placeholder="Enter your full name"
/>

// ❌ WRONG - Custom input styling
<input className="custom-input" />
```

**Buttons**:
```tsx
// ✅ CORRECT - Uses shadcn/ui Button
<Button variant="outline" size="sm">
  <Plus size={16} />
  Add Entry
</Button>

// ❌ WRONG - Custom button
<button className="custom-btn">Add</button>
```

**Cards**:
```tsx
// ✅ CORRECT - Uses shadcn/ui Card
<Card>
  <CardHeader>
    <CardTitle>Work Experience</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// ❌ WRONG - Custom card
<div className="custom-card">
  <div className="card-header">Title</div>
</div>
```

### Performance Considerations

1. **Debounce Input**: Debounce text input updates to avoid excessive re-renders
2. **Lazy Load Templates**: Load template components only when selected
3. **Optimize Images**: Compress uploaded photos to reduce memory usage
4. **Memoization**: Use React.memo for template components to prevent unnecessary re-renders

### Accessibility

1. **Keyboard Navigation**: Ensure all form inputs are keyboard accessible (shadcn/ui handles this)
2. **Screen Reader Support**: Add ARIA labels to form fields
3. **Focus Management**: Manage focus when switching between sections
4. **Color Contrast**: Ensure all templates meet WCAG AA contrast requirements (use existing color variables)

### Localization

1. **UI Labels**: Add Kurdish translations for all UI elements
2. **Date Formatting**: Support both English and Kurdish date formats
3. **Number Formatting**: Handle Kurdish numerals if needed
4. **Bidirectional Text**: Properly handle mixed LTR/RTL content
5. **Font Handling**: Use `font-kufi` class for Kurdish text (already defined in tailwind.config.js)
