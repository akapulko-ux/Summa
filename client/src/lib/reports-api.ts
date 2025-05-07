import { apiRequest } from "@/lib/queryClient";

export interface Report {
  name: string;
  path: string;
  type: string;
  format: string;
  size: number;
  createdAt: string;
}

export interface ReportParams {
  reportType: 'subscriptions' | 'users' | 'services' | 'financial' | 'trends';
  format: 'pdf' | 'excel' | 'csv';
  startDate?: Date;
  endDate?: Date;
  language?: 'en' | 'ru';
}

export interface GenerateReportResponse {
  success: boolean;
  message: string;
  fileName: string;
  downloadUrl: string;
}

/**
 * Get all reports
 */
export async function getReports(): Promise<Report[]> {
  return apiRequest<Report[]>('/api/reports');
}

/**
 * Generate a new report
 */
export async function generateReport(params: ReportParams): Promise<GenerateReportResponse> {
  return apiRequest<GenerateReportResponse>('/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
    },
  } as RequestInit);
}

/**
 * Delete a report
 */
export async function deleteReport(fileName: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/api/reports/${fileName}`, {
    method: 'DELETE',
  } as RequestInit);
}

/**
 * Get download URL for a report
 */
export function getReportDownloadUrl(fileName: string): string {
  return `/api/reports/download/${fileName}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}