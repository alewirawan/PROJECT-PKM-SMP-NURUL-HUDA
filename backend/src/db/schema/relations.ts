import { relations } from "drizzle-orm";
import {
  applications,
  applicationChoices,
  applicationStatusHistory,
  submissionRequests,
} from "./applications.js";
import {
  applicationDocuments,
  applicationDocumentSlots,
  documentReviews,
} from "./documents.js";
import {
  applicantAccounts,
  applicantSessions,
  applicantAccessTokens,
} from "./applicant-auth.js";
import { admissionPeriods } from "./settings.js";
import { clubs } from "./clubs.js";

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    period: one(admissionPeriods, {
      fields: [applications.academicYear],
      references: [admissionPeriods.academicYear],
    }),
    choices: many(applicationChoices),
    documentSlots: many(applicationDocumentSlots),
    statusHistory: many(applicationStatusHistory),
    account: one(applicantAccounts),
    submissions: many(submissionRequests),
  }),
);
export const applicationChoicesRelations = relations(
  applicationChoices,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationChoices.applicationId],
      references: [applications.id],
    }),
    club: one(clubs, {
      fields: [applicationChoices.clubId],
      references: [clubs.id],
    }),
  }),
);
export const applicationStatusHistoryRelations = relations(
  applicationStatusHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStatusHistory.applicationId],
      references: [applications.id],
    }),
  }),
);
export const submissionRequestsRelations = relations(
  submissionRequests,
  ({ one }) => ({
    application: one(applications, {
      fields: [submissionRequests.applicationId],
      references: [applications.id],
    }),
  }),
);
export const documentSlotsRelations = relations(
  applicationDocumentSlots,
  ({ one, many }) => ({
    application: one(applications, {
      fields: [applicationDocumentSlots.applicationId],
      references: [applications.id],
    }),
    currentVersion: one(applicationDocuments, {
      fields: [
        applicationDocumentSlots.currentVersionId,
        applicationDocumentSlots.id,
      ],
      references: [applicationDocuments.id, applicationDocuments.slotId],
      relationName: "currentVersion",
    }),
    versions: many(applicationDocuments, { relationName: "slotVersions" }),
    reviews: many(documentReviews),
  }),
);
export const documentVersionsRelations = relations(
  applicationDocuments,
  ({ one, many }) => ({
    slot: one(applicationDocumentSlots, {
      fields: [applicationDocuments.slotId],
      references: [applicationDocumentSlots.id],
      relationName: "slotVersions",
    }),
    currentFor: many(applicationDocumentSlots, {
      relationName: "currentVersion",
    }),
  }),
);
export const documentReviewsRelations = relations(
  documentReviews,
  ({ one }) => ({
    slot: one(applicationDocumentSlots, {
      fields: [documentReviews.slotId],
      references: [applicationDocumentSlots.id],
    }),
  }),
);
export const applicantAccountsRelations = relations(
  applicantAccounts,
  ({ one, many }) => ({
    application: one(applications, {
      fields: [applicantAccounts.applicationId],
      references: [applications.id],
    }),
    sessions: many(applicantSessions),
    tokens: many(applicantAccessTokens),
  }),
);
export const applicantSessionsRelations = relations(
  applicantSessions,
  ({ one }) => ({
    account: one(applicantAccounts, {
      fields: [applicantSessions.accountId],
      references: [applicantAccounts.id],
    }),
  }),
);
export const applicantTokensRelations = relations(
  applicantAccessTokens,
  ({ one }) => ({
    account: one(applicantAccounts, {
      fields: [applicantAccessTokens.accountId],
      references: [applicantAccounts.id],
    }),
  }),
);
