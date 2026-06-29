# Requirements Document

## Introduction

چارەسەرکردنی کێشەی پیشاندانی پێشبینینی تێمپلەیتەکانی سیڤی لە زمانە RTL (ڕاست بۆ چەپ) وەک کوردی و عەرەبی. لە ئێستادا، ناوەڕۆکی کارتەکانی پێشبینین لە لای چەپەوە دەست پێدەکات بۆ هەموو زمانەکان، کە بۆ زمانە RTL نادروستە و دەبێت لە لای ڕاستەوە دەست پێبکات.

## Glossary

- **TemplateSelector**: کۆمپۆنێنتی React کە لیستی تێمپلەیتەکانی سیڤی پیشان دەدات بە شێوەی کارتی بچووک
- **Preview_Card**: کارتی پێشبینینی بچووک کە وێنەیەکی scale-down کراوی تێمپلەیتەکە پیشان دەدات
- **RTL**: Right-to-Left، زمانەکانی ڕاست بۆ چەپ وەک کوردی و عەرەبی
- **LTR**: Left-to-Right، زمانەکانی چەپ بۆ ڕاست وەک ئینگلیزی
- **transformOrigin**: خاڵی سەرەتای گۆڕانکاری CSS بۆ scale transformation

## Requirements

### Requirement 1: RTL-Aware Transform Origin

**User Story:** As a Kurdish or Arabic user, I want template preview cards to display correctly aligned to the right, so that the content appears natural and properly positioned for RTL languages.

#### Acceptance Criteria

1. WHEN the application language is Kurdish ('ku') or Arabic ('ar'), THE TemplateSelector SHALL set transformOrigin to 'top right' for preview cards
2. WHEN the application language is English or other LTR languages, THE TemplateSelector SHALL set transformOrigin to 'top left' for preview cards
3. WHEN the language changes from LTR to RTL or vice versa, THE preview cards SHALL update their transformOrigin immediately
4. THE preview card container SHALL maintain aspect ratio [1/1.414] regardless of transformOrigin setting

### Requirement 2: Consistent Preview Rendering

**User Story:** As a user, I want all template previews to render consistently within their cards, so that I can accurately compare different templates.

#### Acceptance Criteria

1. WHEN a template preview is rendered, THE content SHALL fill the card container completely without overflow
2. WHEN the transformOrigin changes, THE scale factor (0.12) SHALL remain constant
3. WHEN the transformOrigin changes, THE template dimensions (210mm x 297mm) SHALL remain constant
4. THE preview rendering SHALL maintain visual quality and readability at the scaled size

### Requirement 3: Dynamic Language Support

**User Story:** As a developer, I want the transform origin to be determined dynamically based on the current language, so that the system automatically adapts to language changes.

#### Acceptance Criteria

1. THE TemplateSelector SHALL read the current language from application state
2. WHEN determining transformOrigin, THE system SHALL check if language is 'ku' or 'ar'
3. THE transformOrigin calculation SHALL be performed for each template card independently
4. THE system SHALL not hardcode language-specific values in the transform style
