export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  warehouse: string;
  /** Fecha y hora ISO local (YYYY-MM-DDTHH:mm). */
  lastAccessAt: string;
  status: 'active' | 'blocked';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
}

export interface AuditEntry {
  id: string;
  /** Fecha y hora ISO local (YYYY-MM-DDTHH:mm). */
  date: string;
  user: string;
  action: string;
  module: string;
  record: string;
  result: 'success' | 'error' | 'denied';
}

export interface CompanyField {
  id: string;
  field: string;
  value: string;
}

export interface DocumentSeries {
  id: string;
  documentType: string;
  series: string;
  nextNumber: string;
  warehouse: string;
  status: 'active' | 'inactive';
}

export interface BusinessParameter {
  id: string;
  name: string;
  value: string;
  description: string;
}
