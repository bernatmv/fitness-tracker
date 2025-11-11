/**
 * Central export for all type definitions
 */

export * from './health_metrics';
export * from './config';
export * from './theme';

/**
 * Generic types
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

/**
 * API response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Async operation state
 */
export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Generic async state wrapper
 */
export interface AsyncState<T> {
  state: LoadingState;
  data?: T;
  error?: string;
}

