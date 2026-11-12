export type UploadDocumentKind = "skl" | "ijazah" | "kk" | "ktp" | "kip" | "akta";
export type ApplicationStatus =
  | "Verifikasi"
  | "Terverifikasi"
  | "Wawancara"
  | "Diterima"
  | "Ditolak";
export type DocumentStatus =
  | "Belum ada"
  | "Menunggu pemeriksaan"
  | "Terverifikasi"
  | "Perlu perbaikan";

export type ApplicationCreate = {
  studentName: string;
  nisn: string;
  originSchool: string;
  birthPlace: string;
  birthDate: string;
  gender: "Laki-laki" | "Perempuan";
  address: string;
  parentName: string;
  parentOccupation?: string;
  phone: string;
  email: string;
  extracurriculars?: string[];
};

export type ApplicationReceipt = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
};

export type DocumentRequirements = {
  requiredKinds: UploadDocumentKind[];
  requireOneGraduationDocument: boolean;
};

export type ApplicantDocument = {
  id: string;
  kind: UploadDocumentKind;
  label: string;
  status: DocumentStatus;
  hasFile: boolean;
  receivedPhysically: boolean;
  fileName?: string;
  mimeType?: string;
  size?: number;
  reviewNote?: string;
};

export type ApplicantRecord = {
  id: string;
  status: ApplicationStatus;
  documents: ApplicantDocument[];
  documentRequirements: DocumentRequirements;
};

export type RegistrationSettings = {
  academicYear: string;
  registrationOpen: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  documentRequirements: DocumentRequirements;
};
