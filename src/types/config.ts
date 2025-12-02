import { MetricType } from './health_metrics';

/**
 * Color range configuration for activity visualization
 */
export interface ColorRange {
  /** Array of threshold values defining range boundaries */
  thresholds: number[];
  /** Palette ID to use for colors */
  paletteId: string;
}

/**
 * Configuration for a single metric
 */
export interface MetricConfig {
  metricType: MetricType;
  enabled: boolean;
  colorRange: ColorRange;
  displayName: string;
  iconName?: string;
}

/**
 * Widget size options
 */
export enum WidgetSize {
  SMALL = 'SMALL', // Last 7 days
  MEDIUM = 'MEDIUM', // Last 14 days
  LARGE = 'LARGE', // Last 30 days
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  metricType: MetricType;
  size: WidgetSize;
  enabled: boolean;
}

/**
 * Sync strategy options
 */
export enum SyncStrategy {
  ON_APP_OPEN = 'ON_APP_OPEN',
  PERIODIC = 'PERIODIC',
  HEALTH_OBSERVER = 'HEALTH_OBSERVER',
  HYBRID = 'HYBRID',
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  strategy: SyncStrategy;
  periodicIntervalMinutes?: number; // For PERIODIC or HYBRID
  enableHealthObserver?: boolean; // For HYBRID (iOS only)
}

/**
 * Theme preference options
 */
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * User preferences
 */
export interface UserPreferences {
  language: string;
  dateFormat: string;
  theme: ThemePreference;
  metricConfigs: Record<MetricType, MetricConfig>;
  widgets: WidgetConfig[];
  syncConfig: SyncConfig;
  onboardingCompleted: boolean;
  permissionsGranted: boolean;
  enableMultiRowLayout: boolean;
}

/**
 * App configuration store
 */
export interface AppConfig {
  version: string;
  preferences: UserPreferences;
  lastModified: Date;
}

