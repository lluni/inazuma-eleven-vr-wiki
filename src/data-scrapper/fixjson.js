// Recursively convert numeric string values to numbers
function fixNumericStrings(value) {
  if (Array.isArray(value)) {
    return value.map(fixNumericStrings);
  }

  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = fixNumericStrings(val);
    }
    return result;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    // matches integers or floats, including negatives
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  return value;
}

// Very small, naive jsonc -> json converter (strips // and /* */ comments).
// This assumes comment markers don't appear inside string values.
function stripJsonComments(jsonc) {
  return jsonc
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/(^|\s)\/\/.*$/gm, ""); // line comments
}

// Example usage on a JSONC file:
import fs from "fs";

const input = fs.readFileSync("src/assets/data/players.jsonc", "utf8");
const withoutComments = stripJsonComments(input);
const parsed = JSON.parse(withoutComments);
const fixed = fixNumericStrings(parsed);

// Write result
fs.writeFileSync("output.json", JSON.stringify(fixed, null, 2), "utf8");
console.log("Done: wrote output.json");