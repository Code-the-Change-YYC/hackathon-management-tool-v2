/**
 * Refreshes `src/lib/data/mlh-schools.json` from MLH's list of verified
 * schools, which MLH member events must use for the school question.
 * Run `pnpm mlh:schools`, then commit the updated list.
 */
import { writeFile } from "node:fs/promises";

const SOURCE_URL =
	"https://raw.githubusercontent.com/MLH/mlh-policies/main/schools.csv";
const OUTPUT_PATH = new URL(
	"../src/lib/data/mlh-schools.json",
	import.meta.url
);

/** Splits CSV text into rows of fields, honouring quotes and "" escapes. */
function parseCsv(text: string) {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	for (let index = 0; index < text.length; index += 1) {
		const character = text[index];

		if (inQuotes) {
			if (character === '"' && text[index + 1] === '"') {
				field += '"';
				index += 1;
			} else if (character === '"') {
				inQuotes = false;
			} else {
				field += character;
			}
		} else if (character === '"') {
			inQuotes = true;
		} else if (character === ",") {
			row.push(field);
			field = "";
		} else if (character === "\n" || character === "\r") {
			if (character === "\r" && text[index + 1] === "\n") index += 1;
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else {
			field += character;
		}
	}

	if (field || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}

const response = await fetch(SOURCE_URL);
if (!response.ok) {
	throw new Error(`Couldn't download the MLH school list (${response.status})`);
}

// The first row is a note from MLH, not a school.
const [, ...rows] = parseCsv(await response.text());
const schools = [
	...new Set(rows.map(([name = ""]) => name.trim()).filter(Boolean))
].sort((a, b) => a.localeCompare(b, "en"));

await writeFile(OUTPUT_PATH, `${JSON.stringify(schools, null, "\t")}\n`);
console.log(`Saved ${schools.length} schools to ${OUTPUT_PATH.pathname}`);
