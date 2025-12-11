
/**
 * Safely parses JSON from a string, handling markdown code blocks and extra text.
 */
export const safeJsonParse = <T>(text: string): T => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!text) throw new Error("Empty response text");

    // 1. Try removing markdown code blocks
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(clean);
    } catch (e) {
        // 2. If parsing failed, try extracting the JSON structure strictly
        // Look for the first '{' or '['
        const firstBo = clean.indexOf('{');
        const firstBa = clean.indexOf('[');

        let start = -1;
        let end = -1;

        // Determine if we are looking for an Object or Array based on which comes first
        if (firstBo !== -1 && (firstBa === -1 || firstBo < firstBa)) {
            start = firstBo;
            end = clean.lastIndexOf('}');
        } else if (firstBa !== -1) {
            start = firstBa;
            end = clean.lastIndexOf(']');
        }

        if (start !== -1 && end !== -1 && end > start) {
            const extracted = clean.substring(start, end + 1);
            try {
                return JSON.parse(extracted);
            } catch (inner) {
                console.error("JSON Extraction failed:", extracted);
                throw new Error("Extracted text is not valid JSON.");
            }
        }

        console.error("JSON Parse failed. Raw text:", text);
        throw new Error("Could not find valid JSON in response.");
    }
};
