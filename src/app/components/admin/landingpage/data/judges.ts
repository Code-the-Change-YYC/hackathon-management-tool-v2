import { getFields, getNumber, getString } from "@/lib/contentful";
import type { Judge } from "@/types/contentfulTypes";

function compareJudges(left: Judge, right: Judge): number {
	const leftFields = getFields(left);
	const rightFields = getFields(right);
	const leftOrder =
		getNumber(leftFields.orderNumber) ?? Number.POSITIVE_INFINITY;
	const rightOrder =
		getNumber(rightFields.orderNumber) ?? Number.POSITIVE_INFINITY;
	if (leftOrder !== rightOrder) {
		return leftOrder < rightOrder ? -1 : 1;
	}

	const nameComparison = compareStrings(
		getString(leftFields.judgeName)?.trim() ?? "",
		getString(rightFields.judgeName)?.trim() ?? ""
	);
	return nameComparison !== 0
		? nameComparison
		: compareStrings(left.sys.id, right.sys.id);
}

function compareStrings(left: string, right: string): number {
	if (left === right) {
		return 0;
	}
	return left < right ? -1 : 1;
}

function isRenderableJudge(entry: Judge): boolean {
	const fields = getFields(entry);
	return Boolean(
		getString(fields.judgeName)?.trim() &&
			getString(fields.judgeCompany)?.trim()
	);
}

export function mapJudges(entries: readonly Judge[]): Judge[] {
	return entries.filter(isRenderableJudge).sort(compareJudges);
}
