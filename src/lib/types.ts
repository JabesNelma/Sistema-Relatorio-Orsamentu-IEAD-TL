// Shared types used across frontend and backend.

export type Role = "SUPER_ADMIN" | "ADMIN_REGIONAL" | "ADMIN_LOKAL";

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  regionId: number | null;
  sukuId: number | null;
  regionName: string | null;
  sukuName: string | null;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  active: boolean;
  regionId: number | null;
  regionName: string | null;
  sukuId: number | null;
  sukuName: string | null;
  createdAt: string;
  qrTokens: QrTokenInfo[];
};

export type QrTokenInfo = {
  id: string;
  token: string;
  label: string;
  active: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type FinancialReportRow = {
  id: number;
  date: string;
  persembahan: number;
  perpuluhan: number;
  kontribusi: number;
  total: number;
  catatan: string | null;
  sukuId: number;
  sukuName: string;
  municipalityName: string;
  createdByName: string;
  createdAt: string;
};

export type RegionalSummary = {
  totalPersembahan: number;
  totalPerpuluhan: number;
  totalKontribusi: number;
  grandTotal: number;
  reportCount: number;
  sukuCount: number;
  monthlyData: MonthlyPoint[];
  sukuBreakdown: SukuBreakdown[];
  categoryBreakdown: { name: string; value: number }[];
};

export type MonthlyPoint = {
  month: string;
  persembahan: number;
  perpuluhan: number;
  kontribusi: number;
  total: number;
};

export type SukuBreakdown = {
  sukuName: string;
  municipalityName: string;
  total: number;
  persembahan: number;
  perpuluhan: number;
  kontribusi: number;
  reportCount: number;
};

export type RegionInfo = {
  id: number;
  name: string;
  code: string;
  description: string | null;
};

export type MunicipalityInfo = {
  id: number;
  name: string;
  regionId: number;
};

export type SukuInfo = {
  id: number;
  name: string;
  municipalityId: number;
  regionId: number;
};
