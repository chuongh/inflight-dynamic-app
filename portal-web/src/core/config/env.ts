export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? 'mock') as 'mock' | 'api',
  appName: 'In-flight Dynamic App',
} as const
