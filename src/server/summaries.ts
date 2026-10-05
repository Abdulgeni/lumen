import type { Prisma } from "../generated/prisma/client";
import { escapeLike } from "../lib/text";
import type { ListQuery } from "../lib/validation/summary";
import { db } from "./db";

export const listSelect = {
  id: true,
  title: true,
  preview: true,
  mode: true,
  length: true,
  tone: true,
  sourceType: true,
  sourceUrl: true,
  sourceName: true,
  outputLanguage: true,
  isFavorite: true,
  aiModel: true,
  inputWords: true,
  outputWords: true,
  createdAt: true,
} satisfies Prisma.SummarySelect;

const detailSelect = {
  ...listSelect,
  resultMarkdown: true,
  updatedAt: true,
} satisfies Prisma.SummarySelect;

export async function listSummaries(userId: string, query: ListQuery) {
  const where: Prisma.SummaryWhereInput = {
    userId,
    status: "COMPLETED",
    ...(query.mode && { mode: query.mode }),
    ...(query.source && { sourceType: query.source }),
    ...(query.favorite && { isFavorite: query.favorite === "true" }),
    ...(query.q && {
      OR: [
        { title: { contains: escapeLike(query.q), mode: "insensitive" } },
        { resultMarkdown: { contains: escapeLike(query.q), mode: "insensitive" } },
        { sourceName: { contains: escapeLike(query.q), mode: "insensitive" } },
      ],
    }),
  };

  const direction = query.sort === "oldest" ? "asc" : "desc";
  const [items, total] = await db.$transaction([
    db.summary.findMany({
      where,
      select: listSelect,
      orderBy: [{ createdAt: direction }, { id: direction }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.summary.count({ where }),
  ]);

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export function getSummary(userId: string, id: string) {
  return db.summary.findFirst({ where: { id, userId, status: "COMPLETED" }, select: detailSelect });
}

export async function updateSummary(
  userId: string,
  id: string,
  patch: { title?: string | undefined; isFavorite?: boolean | undefined },
) {
  const { count } = await db.summary.updateMany({
    where: { id, userId, status: "COMPLETED" },
    data: {
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.isFavorite !== undefined && { isFavorite: patch.isFavorite }),
    },
  });
  return count === 0 ? null : getSummary(userId, id);
}

export async function deleteSummary(userId: string, id: string): Promise<boolean> {
  const { count } = await db.summary.deleteMany({ where: { id, userId } });
  return count > 0;
}

export type SummaryListItem = Prisma.SummaryGetPayload<{ select: typeof listSelect }>;
