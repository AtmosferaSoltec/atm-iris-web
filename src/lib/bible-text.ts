/**
 * A verse as it is projected. The RVR 1909 marks the words its translators supplied with
 * brackets ("[es á saber]"); on a screen the brackets only get in the way, the words stay.
 */
export function verseText(text: string): string {
  return text
    .replace(/[[\]]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
