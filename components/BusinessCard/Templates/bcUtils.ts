import { CustomizationOptions } from '../../../types';

export const getFontScale = (customization: CustomizationOptions) => {
  const size = customization.fontSize || 'medium';
  switch (size) {
    case 'small': return 0.85;
    case 'large': return 1.15;
    default: return 1;
  }
};

export const scaled = (basePx: number, scale: number) => `${basePx * scale}px`;
