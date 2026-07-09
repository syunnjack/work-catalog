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

// /admin(メーカー提出情報レビュー画面)での審査結果。ここではmaker_submissions.statusの
// 更新のみを扱う。承認内容をworks/work_actress/aliasesへ反映する作業は運営者が別途手動で行う
// (docs/architecture.md「メーカー公式提出チャネル」参照)。
export const makerSubmissionReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});
