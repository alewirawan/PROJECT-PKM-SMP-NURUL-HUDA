import type { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import type { ApplicationSubmissionService } from "./application-submission.service.js";
import {
  applicationDocumentKinds,
  idempotencyKey,
  publicApplicationData,
  type PublicApplicationDocumentKind,
  type PublicApplicationFile,
} from "./public-application.schema.js";
import {
  safeOriginalName,
  sniffDocumentMimeType,
} from "./public-document-store.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_JSON_BYTES = 16 * 1024;
const MAX_REQUEST_BYTES = 32 * 1024 * 1024;
const DOCUMENT_KINDS = new Set<string>(applicationDocumentKinds);
const MIME_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
};

function multipartLimitError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return [
    "RequestFileTooLargeError",
    "FilesLimitError",
    "PartsLimitError",
    "FieldsLimitError",
  ].includes(error.name);
}

function fileError(message: string, statusCode = 415) {
  return new AppError(
    message,
    statusCode,
    statusCode === 413 ? "PAYLOAD_TOO_LARGE" : "UNSUPPORTED_MEDIA_TYPE",
  );
}

async function parseMultipart(
  request: FastifyRequest,
): Promise<{ data: unknown; files: PublicApplicationFile[] }> {
  let data: unknown;
  let hasData = false;
  let totalBytes = 0;
  const files: PublicApplicationFile[] = [];
  const seenKinds = new Set<string>();

  try {
    for await (const part of request.parts({
      limits: {
        files: 7,
        fields: 0,
        parts: 7,
        fileSize: MAX_FILE_BYTES,
        fieldSize: MAX_JSON_BYTES,
        fieldNameSize: 64,
      },
    })) {
      if (part.type !== "file")
        throw new AppError(
          "Formulir multipart tidak valid.",
          422,
          "VALIDATION_ERROR",
        );
      if (part.fieldname === "data") {
        if (hasData || part.mimetype !== "application/json")
          throw new AppError(
            "Data pendaftaran harus dikirim satu kali sebagai JSON.",
            422,
            "VALIDATION_ERROR",
          );
        hasData = true;
        const content = await part.toBuffer();
        totalBytes += content.byteLength;
        if (content.byteLength > MAX_JSON_BYTES)
          throw fileError("Data formulir melebihi batas 16 KiB.", 413);
        try {
          data = JSON.parse(content.toString("utf8")) as unknown;
        } catch {
          throw new AppError(
            "Data pendaftaran bukan JSON yang valid.",
            422,
            "VALIDATION_ERROR",
          );
        }
        continue;
      }

      if (!DOCUMENT_KINDS.has(part.fieldname))
        throw new AppError(
          "Jenis berkas tidak dikenal.",
          422,
          "VALIDATION_ERROR",
        );
      if (seenKinds.has(part.fieldname))
        throw new AppError(
          "Setiap jenis berkas hanya boleh dikirim satu kali.",
          422,
          "VALIDATION_ERROR",
        );
      seenKinds.add(part.fieldname);

      const content = await part.toBuffer();
      totalBytes += content.byteLength;
      if (part.file.truncated || content.byteLength > MAX_FILE_BYTES)
        throw fileError("Ukuran setiap berkas maksimal 5 MiB.", 413);
      if (content.byteLength === 0)
        throw new AppError(
          "Berkas tidak boleh kosong.",
          422,
          "VALIDATION_ERROR",
        );
      const mimeType = sniffDocumentMimeType(content);
      if (
        !mimeType ||
        (part.mimetype !== "application/octet-stream" &&
          part.mimetype !== mimeType)
      )
        throw fileError("Isi berkas harus PDF, JPG, atau PNG yang valid.");
      const originalName = safeOriginalName(part.filename);
      if (!originalName)
        throw new AppError(
          "Nama berkas tidak valid.",
          422,
          "VALIDATION_ERROR",
        );
      const lastDot = originalName.lastIndexOf(".");
      const extension = lastDot > 0 ? originalName.slice(lastDot + 1).toLowerCase() : "";
      if (extension && !MIME_EXTENSIONS[mimeType]?.includes(extension))
        throw fileError("Ekstensi berkas tidak sesuai dengan isinya.");
      files.push({
        kind: part.fieldname as PublicApplicationDocumentKind,
        originalName,
        mimeType,
        content,
      });
    }
  } catch (error) {
    if (multipartLimitError(error))
      throw fileError("Batas jumlah atau ukuran formulir terlampaui.", 413);
    throw error;
  }

  if (!hasData || data === undefined)
    throw new AppError(
      "Data pendaftaran wajib disertakan.",
      422,
      "VALIDATION_ERROR",
    );
  if (totalBytes > MAX_REQUEST_BYTES)
    throw fileError("Ukuran formulir melebihi batas 32 MiB.", 413);
  return { data, files };
}

export async function registerApplicationSubmissionRoutes(
  app: FastifyInstance,
  service: ApplicationSubmissionService,
) {
  app.post(
    "/applications",
    {
      bodyLimit: MAX_REQUEST_BYTES,
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const key = parseInput(
        idempotencyKey,
        request.headers["idempotency-key"],
      );
      const parsed = await parseMultipart(request);
      const data = parseInput(publicApplicationData, parsed.data);
      const receipt = await service.submit(key, data, parsed.files);
      reply.header("Cache-Control", "no-store");
      return reply.code(201).send(receipt);
    },
  );
}
