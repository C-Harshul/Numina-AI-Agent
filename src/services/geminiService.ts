import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedRule, ConversionResult } from '../types/audit';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('Gemini API key not found. Using fallback parsing.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
    }
  }

  async parseInstruction(instruction: string): Promise<ConversionResult> {
    // If Gemini is not available, fall back to rule-based parsing
    if (!this.model) {
      return this.fallbackParsing(instruction);
    }

    try {
      const prompt = this.buildPrompt(instruction);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseGeminiResponse(text, instruction);
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fall back to rule-based parsing on error
      return this.fallbackParsing(instruction);
    }
  }

  private buildPrompt(instruction: string): string {
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
  }

  private parseGeminiResponse(response: string, originalInstruction: string): ConversionResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedRule = JSON.parse(jsonMatch[0]) as ParsedRule;

      // Validate the parsed rule
      if (!this.validateParsedRule(parsedRule)) {
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
        error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Try rephrasing your instruction more clearly',
          'Include specific amounts, categories, or conditions',
          'Use clear action words like "flag", "review", "reject", or "approve"'
        ]
      };
    }
  }

  private validateParsedRule(rule: any): rule is ParsedRule {
    return (
      rule &&
      typeof rule.rule_type === 'string' &&
      Array.isArray(rule.conditions) &&
      typeof rule.action === 'string' &&
      typeof rule.reason === 'string' &&
      typeof rule.confidence_score === 'number' &&
      rule.confidence_score >= 0 &&
      rule.confidence_score <= 1 &&
      rule.conditions.every((condition: any) =>
        condition.field &&
        condition.operator &&
        condition.value !== undefined
      )
    );
  }

  private fallbackParsing(instruction: string): ConversionResult {
    // Import and use the original rule-based parser as fallback
    const normalizedInstruction = instruction.toLowerCase().trim();
    
    // Simple fallback logic
    const action = this.extractAction(normalizedInstruction);
    const ruleType = this.determineRuleType(normalizedInstruction);
    const conditions = this.extractBasicConditions(normalizedInstruction);

    if (!ruleType) {
      return {
        success: false,
        error: 'Could not determine rule type. Please check your Gemini API configuration.',
        suggestions: [
          'Ensure VITE_GEMINI_API_KEY is set in your environment',
          'Try using more specific keywords like "expense", "vendor", "category"',
          'Include threshold amounts with $ symbol'
        ]
      };
    }

    const rule: ParsedRule = {
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
  }

  private extractAction(instruction: string): string {
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
  }

  private determineRuleType(instruction: string): string | null {
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
  }

  private extractBasicConditions(instruction: string): any[] {
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
  }

  isGeminiAvailable(): boolean {
    return this.model !== null;
  }

  getStatus(): { available: boolean; apiKey: boolean } {
    return {
      available: this.model !== null,
      apiKey: !!import.meta.env.VITE_GEMINI_API_KEY
    };
  }
}