import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
let genAI = null;
let model = null;

const initializeGemini = () => {
  // Try both environment variable names
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  console.log('🔍 Initializing Gemini AI...');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Not found');
  console.log('- VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? '✅ Found' : '❌ Not found');
  
  if (!apiKey) {
    console.warn('⚠️  Gemini API key not found. AI parsing will use fallback method.');
    console.warn('   Please add GEMINI_API_KEY to your server/.env file');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error.message);
    return false;
  }
};

// Initialize on startup
const isGeminiAvailable = initializeGemini();

// Get Gemini status
router.get('/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  res.json({
    success: true,
    data: {
      available: model !== null,
      apiKey: !!apiKey,
      model: model ? 'gemini-pro' : null,
      debug: {
        gemini_api_key_set: !!process.env.GEMINI_API_KEY,
        vite_gemini_api_key_set: !!process.env.VITE_GEMINI_API_KEY,
        using_key: apiKey ? 'Found' : 'Not found'
      }
    }
  });
});

// Parse instruction using Gemini AI
router.post('/parse', async (req, res) => {
  try {
    const { instruction } = req.body;
    
    if (!instruction || !instruction.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Instruction cannot be empty',
        suggestions: ['Please provide a clear audit instruction']
      });
    }

    // If Gemini is not available, use fallback parsing
    if (!model) {
      console.log('🔄 Using fallback parsing (Gemini not available)');
      const fallbackResult = fallbackParsing(instruction);
      return res.json(fallbackResult);
    }

    try {
      console.log('🤖 Processing with Gemini AI:', instruction.substring(0, 50) + '...');
      const prompt = buildPrompt(instruction);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsedResult = parseGeminiResponse(text, instruction);
      console.log('✅ Gemini parsing completed');
      res.json(parsedResult);
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      // Fall back to rule-based parsing on error
      const fallbackResult = fallbackParsing(instruction);
      res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Parse instruction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse instruction',
      suggestions: [
        'Check your internet connection',
        'Verify your Gemini API key is configured correctly',
        'Try simplifying your instruction'
      ]
    });
  }
});

// Build prompt for Gemini
const buildPrompt = (instruction) => {
  return `
You are an expert audit rule parser. Convert the following natural language audit instruction into a structured JSON rule.

INSTRUCTION: "${instruction}"

Please analyze the instruction and return a JSON object with the following structure:
{
  "rule_type": "string (one of: expense_amount_threshold, vendor_frequency, category_amount_threshold, duplicate_detection, time_based, compliance_check)",
  "conditions": [
    {
      "field": "string (e.g., amount, vendor, category, time, etc.)",
      "operator": "string (gt, lt, eq, ne, contains, not_contains, in, not_in)",
      "value": "any (the threshold value, category name, etc.)",
      "logical_operator": "string (AND, OR) - optional"
    }
  ],
  "action": "string (flag, review, reject, approve)",
  "reason": "string (human-readable explanation of what the rule does)",
  "confidence_score": "number (0.0 to 1.0 indicating confidence in the parsing)"
}

IMPORTANT RULES:
1. Extract specific numeric thresholds (amounts, frequencies, percentages)
2. Identify the main action (flag, review, reject, approve)
3. Determine the rule type based on what's being checked
4. Create logical conditions that can be evaluated programmatically
5. Provide a confidence score based on how clear the instruction is
6. If the instruction mentions "not" or exclusions, use appropriate operators
7. For time-based rules, extract specific times or time ranges
8. For duplicate detection, focus on matching criteria (amount, vendor, date, etc.)

EXAMPLES:
- "Flag any expense above $1,000 not tagged as capital expenditure" → expense_amount_threshold with amount > 1000 AND category not_contains "capital"
- "If a vendor appears more than twice in one day, flag for review" → vendor_frequency with frequency > 2 AND timeframe = "day"
- "Review any expense after 10 PM" → time_based with time > "22:00"

Return ONLY the JSON object, no additional text or explanation.
`;
};

// Parse Gemini response
const parseGeminiResponse = (response, originalInstruction) => {
  try {
    // Clean the response to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsedRule = JSON.parse(jsonMatch[0]);

    // Validate the parsed rule
    if (!validateParsedRule(parsedRule)) {
      throw new Error('Invalid rule structure from Gemini');
    }

    return {
      success: true,
      rule: parsedRule
    };

  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    return {
      success: false,
      error: `Failed to parse AI response: ${error.message}`,
      suggestions: [
        'Try rephrasing your instruction more clearly',
        'Include specific amounts, categories, or conditions',
        'Use clear action words like "flag", "review", "reject", or "approve"'
      ]
    };
  }
};

// Validate parsed rule structure
const validateParsedRule = (rule) => {
  return (
    rule &&
    typeof rule.rule_type === 'string' &&
    Array.isArray(rule.conditions) &&
    typeof rule.action === 'string' &&
    typeof rule.reason === 'string' &&
    typeof rule.confidence_score === 'number' &&
    rule.confidence_score >= 0 &&
    rule.confidence_score <= 1 &&
    rule.conditions.every((condition) =>
      condition.field &&
      condition.operator &&
      condition.value !== undefined
    )
  );
};

// Fallback parsing when Gemini is not available
const fallbackParsing = (instruction) => {
  const normalizedInstruction = instruction.toLowerCase().trim();
  
  const action = extractAction(normalizedInstruction);
  const ruleType = determineRuleType(normalizedInstruction);
  const conditions = extractBasicConditions(normalizedInstruction);

  if (!ruleType) {
    return {
      success: false,
      error: 'Could not determine rule type. Please check your Gemini API configuration.',
      suggestions: [
        'Ensure GEMINI_API_KEY is set in your server/.env file',
        'Try using more specific keywords like "expense", "vendor", "category"',
        'Include threshold amounts with $ symbol'
      ]
    };
  }

  const rule = {
    rule_type: ruleType,
    conditions,
    action,
    reason: `${action.charAt(0).toUpperCase() + action.slice(1)} based on ${ruleType.replace('_', ' ')}`,
    confidence_score: 0.6 // Lower confidence for fallback parsing
  };

  return {
    success: true,
    rule
  };
};

const extractAction = (instruction) => {
  const actionKeywords = {
    flag: ['flag', 'mark', 'highlight', 'identify'],
    review: ['review', 'check', 'examine', 'investigate'],
    reject: ['reject', 'deny', 'block', 'prevent'],
    approve: ['approve', 'accept', 'allow', 'permit']
  };

  for (const [action, keywords] of Object.entries(actionKeywords)) {
    if (keywords.some(keyword => instruction.includes(keyword))) {
      return action;
    }
  }
  return 'flag';
};

const determineRuleType = (instruction) => {
  if (/expense.*amount|amount.*above|cost.*over/i.test(instruction)) {
    return 'expense_amount_threshold';
  }
  if (/vendor.*frequency|appears.*times|vendor.*day/i.test(instruction)) {
    return 'vendor_frequency';
  }
  if (/category.*amount|tagged.*over|categorized.*above/i.test(instruction)) {
    return 'category_amount_threshold';
  }
  if (/duplicate|same.*transaction|identical/i.test(instruction)) {
    return 'duplicate_detection';
  }
  if (/time|after|before|am|pm/i.test(instruction)) {
    return 'time_based';
  }
  return null;
};

const extractBasicConditions = (instruction) => {
  const conditions = [];
  
  // Extract amount
  const amountMatch = instruction.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (amountMatch) {
    conditions.push({
      field: 'amount',
      operator: 'gt',
      value: parseFloat(amountMatch[1].replace(/,/g, ''))
    });
  }

  return conditions;
};

export default router;