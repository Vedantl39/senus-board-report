/**
 * Splits the Measure/Report/Verify commentary text (Markdown "##"
 * headings, per buildCommentaryPrompt.js's system prompt) into its three
 * sections for independent rendering.
 */
export function parseCommentarySections(text) {
  const sections = { measure: "", report: "", verify: "" };
  if (!text) return sections;

  const headingRegex = /^##\s*(measure|report|verify)\s*$/gim;
  const parts = text.split(headingRegex);

  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i]?.toLowerCase();
    const content = parts[i + 1]?.trim() ?? "";
    if (heading && Object.prototype.hasOwnProperty.call(sections, heading)) {
      sections[heading] = content;
    }
  }

  return sections;
}
