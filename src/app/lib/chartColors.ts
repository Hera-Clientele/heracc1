/**
 * Chart color constants for consistent styling across all chart components
 */

export const CHART_COLORS = {
  // Platform-specific colors
  tiktok: {
    primary: '#10b981',      // Green
    light: '#10b981',
    dark: '#059669',
    gradient: {
      start: '#10b981',
      end: '#10b981'
    }
  },
  instagram: {
    primary: '#e4405f',      // Pink/Red
    light: '#e4405f',
    dark: '#be185d',
    gradient: {
      start: '#e4405f',
      end: '#e4405f'
    }
  },
  facebook: {
    primary: '#1877f2',      // Blue
    light: '#1877f2',
    dark: '#0d6efd',
    gradient: {
      start: '#1877f2',
      end: '#1877f2'
    }
  },
  // Special colors
  total: '#ffffff',           // White for total lines
  grid: '#374151',            // Dark gray for grid lines
  text: '#f3f4f6'            // Light gray for text
} as const;

/**
 * Get platform color by platform name
 */
export function getPlatformColor(platform: 'tiktok' | 'instagram' | 'facebook') {
  return CHART_COLORS[platform];
}

/**
 * Get all platform colors as an array
 */
export function getAllPlatformColors() {
  return [
    CHART_COLORS.tiktok.primary,
    CHART_COLORS.instagram.primary,
    CHART_COLORS.facebook.primary
  ];
}




