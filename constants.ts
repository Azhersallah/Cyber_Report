import { LayoutType } from "./types";

export const LAYOUTS: { id: LayoutType; label: string; capacity: number }[] = [
  { id: '1', label: 'layout.1', capacity: 1 },
  { id: '1text', label: 'layout.1text', capacity: 1 },
  { id: '1text-side', label: 'layout.1text-side', capacity: 1 },
  { id: '2', label: 'layout.2', capacity: 2 },
  { id: '2col', label: 'layout.2col', capacity: 2 },
  { id: '2text', label: 'layout.2text', capacity: 2 },
  { id: '2text1', label: 'layout.2text1', capacity: 2 },
  { id: '2text1-side', label: 'layout.2text1-side', capacity: 2 },
  { id: '3grid', label: 'layout.3grid', capacity: 3 },
  { id: '4', label: 'layout.4', capacity: 4 },
  { id: 'onlytext', label: 'layout.onlytext', capacity: 0 },
  { id: 'custom', label: 'layout.custom', capacity: 6 },
  { id: 'invoice', label: 'nav.invoice', capacity: 2 },
  { id: 'invoice-1', label: 'nav.invoice', capacity: 1 },
  { id: 'invoice-4', label: 'nav.invoice', capacity: 4 },
  { id: 'businesscard', label: 'nav.businesscard', capacity: 10 },
  { id: 'businesscard-form', label: 'card.formLayout', capacity: 6 },
  { id: 'businesscard-form-reverse', label: 'card.formLayout', capacity: 6 },

  { id: 'idphoto', label: 'nav.idphoto', capacity: 4 },
  { id: 'idphoto-1', label: 'nav.idphoto', capacity: 1 },
  { id: 'idphoto-2', label: 'nav.idphoto', capacity: 2 },
  { id: 'idphoto-4', label: 'nav.idphoto', capacity: 4 },
];

export function getLayoutCapacity(layoutId: string, settings?: { customCols?: number; customRows?: number }): number {
  if (layoutId === 'custom') {
    const cols = settings?.customCols || 2;
    const rows = settings?.customRows || 3;
    return cols * rows;
  }
  const layoutDef = LAYOUTS.find(l => l.id === layoutId);
  return layoutDef ? layoutDef.capacity : 1;
}

export const FONTS = [
  'Inter',
  'Noto Kufi Arabic', 
  'Noto Naskh Arabic'
];

export const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#6366f1'
];