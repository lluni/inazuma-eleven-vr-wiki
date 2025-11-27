// Scrapes all special move names from the Victory Road zukan page
// and saves them as a JSON array.
//
// Usage (from project root, after compiling or with a TS runner):
//   node dist/src/data-scrapper/abilities.js
//   - or -
//   tsx src/data-scrapper/abilities.ts

import fs from "node:fs";
import path from "node:path";
import { type CheerioAPI, load } from "cheerio";

const URL =
  "https://zukan.inazuma.jp/en/skill/?per_page=1000";

type Ability = {
  name: string;
  types: string[];
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function extractAbilities(html: string): Ability[] {
  const $: CheerioAPI = load(html);
  const abilities = new Map<string, Ability>();

  $("ul.skillListBox > li").each((_, li) => {
    const name = $(li)
      .find("div.nameBox span.name")
      .first()
      .clone()
      .find("rt")
      .remove()
      .end()
      .text()
      .trim();

    if (!name) return;

    const types: string[] = [];

    $(li)
      .find("div.detailBox .btnBox .btnMovie")
      .each((_, btn) => {
        const typeText = $(btn)
          .text()
          .replace(/\s+/g, " ")
          .trim();
        if (typeText) types.push(typeText);
      });

    const uniqueTypes = Array.from(new Set(types));

    abilities.set(name, { name, types: uniqueTypes });
  });

  return Array.from(abilities.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main(): Promise<void> {
  try {
    console.log(`Fetching HTML from ${URL} ...`);
    const html = await fetchHtml(URL);

    console.log("Extracting abilities...");
    const abilities = extractAbilities(html);

    console.log(`Found ${abilities.length} moves. Writing JSON file...`);

    const outPath = path.resolve(
      process.cwd(),
      "src",
      "assets",
      "data",
      "abilities.json",
    );

    ensureDir(outPath);
    fs.writeFileSync(outPath, JSON.stringify(abilities, null, 2), "utf8");

    console.log(`Done. Saved to ${outPath}`);
  } catch (err) {
    console.error("Error while scraping abilities:", err);
    process.exitCode = 1;
  }
}

  main();

