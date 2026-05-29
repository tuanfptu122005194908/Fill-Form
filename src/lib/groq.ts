const GROQ_KEYS = [
  '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',
  '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',
  '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',
  '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'
];

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768'
];

let currentKeyIndex = 0;
let currentModelIndex = 0;

/**
 * Generates text using Groq API with automatic key rotation and model fallback on failure.
 */
export async function generateWithGroq(prompt: string, initialModel?: string): Promise<string> {
  const keyCount = GROQ_KEYS.length;
  const modelCount = GROQ_MODELS.length;
  
  let attempts = 0;
  const maxAttempts = keyCount * modelCount;

  while (attempts < maxAttempts) {
    const keyIndex = (currentKeyIndex + Math.floor(attempts / modelCount)) % keyCount;
    const modelIndex = (currentModelIndex + (attempts % modelCount)) % modelCount;
    
    const apiKey = GROQ_KEYS[keyIndex];
    const model = initialModel || GROQ_MODELS[modelIndex];

    try {
      console.log(`[Groq AI] Attempting generation with key index: ${keyIndex}, model: ${model}`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 2048
        })
      });

      // Handle Rate Limits (429) or Auth Errors (401)
      if (response.status === 429 || response.status === 401) {
        console.warn(`[Groq AI] Key index ${keyIndex} returned status ${response.status}. Rotating key...`);
        attempts += modelCount; // Move to next key directly
        continue;
      }

      // Handle Model Decommissioned / Not Found (400)
      if (response.status === 400) {
        const errText = await response.text();
        if (errText.includes('decommissioned') || errText.includes('not supported') || errText.includes('not found') || errText.includes('model')) {
          console.warn(`[Groq AI] Model ${model} is decommissioned or not found. Rotating model...`);
          attempts++; // Try next model
          continue;
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq response contains no message choices content.');
      }

      // Save the successful key and model indexes for next requests
      currentKeyIndex = keyIndex;
      if (!initialModel) {
        currentModelIndex = modelIndex;
      }
      console.log(`[Groq AI] Successfully completed request using key index: ${keyIndex}, model: ${model}`);
      return content;
    } catch (error) {
      console.error(`[Groq AI] Error using key index ${keyIndex} with model ${model}:`, error);
      attempts++;
    }
  }

  throw new Error('Tất cả API key của Groq đều hết hạn hoặc gặp lỗi (Rate Limit/Model Decommissioned). Vui lòng thử lại sau!');
}

/**
 * Cleans the AI response by removing numbering, bullets, introduction phrases,
 * and splitting the result into a clean list of individual lines.
 */
export function cleanAIResponse(response: string, expectedCount: number): string[] {
  const lines = response.split('\n');
  const cleaned: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Filter out introduction or metadata lines
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.startsWith('dưới đây là') ||
      lowerLine.startsWith('đây là') ||
      lowerLine.startsWith('câu trả lời:') ||
      lowerLine.startsWith('danh sách') ||
      lowerLine.includes('câu trả lời cho câu hỏi') ||
      (lowerLine.includes('câu trả lời') && line.endsWith(':'))
    ) {
      continue;
    }

    // Strip leading numbers/bullets/dashes (e.g. "1.", "- ", "* ", "1)", "Câu 1:")
    let cleanedLine = line
      .replace(/^(câu\s+\d+[:.]?|[\d+]+[\s.)-]*|[-*•+])\s*/i, '')
      .trim();

    // Remove wrapping double or single quotes
    if (cleanedLine.startsWith('"') && cleanedLine.endsWith('"')) {
      cleanedLine = cleanedLine.slice(1, -1);
    }
    if (cleanedLine.startsWith("'") && cleanedLine.endsWith("'")) {
      cleanedLine = cleanedLine.slice(1, -1);
    }

    cleanedLine = cleanedLine.trim();
    if (cleanedLine) {
      cleaned.push(cleanedLine);
    }
  }

  // Fallback to splitting and simple number removal if cleaning left nothing
  if (cleaned.length === 0) {
    return lines
      .map(l => l.replace(/^(câu\s+\d+[:.]?|[\d+]+[\s.)-]*|[-*•+])\s*/i, '').trim())
      .filter(l => l.length > 0);
  }

  return cleaned.slice(0, expectedCount);
}
