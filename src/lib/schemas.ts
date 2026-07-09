import { z } from "zod";

export const commentSchema = z.object({
  workId: z.string().min(1),
  body: z.string().min(1).max(1000),
  anonymousName: z.string().max(50).optional(),
});

export const favoriteSchema = z.object({
  workId: z.string().min(1),
});

// メーカー/レーベルからの公式情報提出・修正依頼。第三者による特定申請ではなく、
// 権利者本人からの公式情報提供のみを受け付ける窓口（docs/architecture.md参照）。
export const makerSubmissionSchema = z.object({
  makerId: z.string().optional(),
  workId: z.string().optional(),
  submitterOrganization: z.string().min(1, "提出元の企業名を入力してください。"),
  submitterContact: z.string().min(1, "連絡先を入力してください。"),
  submissionType: z.enum([
    "new_work",
    "work_correction",
    "cast_credit_addition",
    "cast_credit_correction",
    "distribution_link",
  ]),
  payload: z.record(z.string(), z.unknown()),
});

// 中古相場(第二の核)の価格変動通知登録。
export const priceWatchSchema = z.object({
  workId: z.string().min(1),
  notifyBelowPriceYen: z.number().positive().optional(),
});

// 作品の星評価(1〜5)。
export const workRatingSchema = z.object({
  workId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

// ユーザーからの中古相場報告。運営者が確認してapprovedにするまでは相場として表示しない。
export const marketPriceReportSchema = z.object({
  workId: z.string().min(1),
  platformId: z.string().min(1),
  priceYen: z.number().positive(),
  note: z.string().max(500).optional(),
  sourceUrl: z.string().url().optional(),
});

// /admin(中古相場報告レビュー画面)での審査結果。
export const marketPriceReportReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});

// お気に入りリストの公開共有設定。
export const favoritesSharingSchema = z.object({
  action: z.enum(["enable", "disable", "regenerate"]),
});

// 新作発売日通知(第一の核の再訪問導線)。メーカー/レーベル/シリーズのいずれか1つだけを指定する。
export const notificationSubscriptionSchema = z
  .object({
    makerId: z.string().min(1).optional(),
    labelId: z.string().min(1).optional(),
    seriesId: z.string().min(1).optional(),
  })
  .refine((data) => [data.makerId, data.labelId, data.seriesId].filter(Boolean).length === 1, {
    message: "makerId, labelId, seriesIdのいずれか1つだけを指定してください。",
  });

// /admin(メーカー提出情報レビュー画面)での審査結果。ここではmaker_submissions.statusの
// 更新のみを扱う。承認内容をworks/work_actress/aliasesへ反映する作業は運営者が別途手動で行う
// (docs/architecture.md「メーカー公式提出チャネル」参照)。
export const makerSubmissionReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});
