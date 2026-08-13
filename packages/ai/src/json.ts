/**
 * Robust extraction of the first JSON object from a model response.
 *
 * Model output is variable — sometimes wrapped in ```json fences, sometimes
 * preceded by prose. We locate the first balanced `{...}` block.
 */

export function extractJsonBlock(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("no_json_in_response");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const json = text.slice(start, i + 1);
        try {
          return JSON.parse(json) as unknown;
        } catch {
          throw new Error("malformed_json_in_response");
        }
      }
    }
  }
  throw new Error("unterminated_json_in_response");
}

export function extractJsonString(text: string): string {
  const parsed = extractJsonBlock(text);
  if (parsed !== null && typeof parsed === "object" && "answer" in parsed) {
    const answer = (parsed as { answer?: unknown }).answer;
    if (typeof answer === "string") return answer;
  }
  throw new Error("no_answer_field");
}