import { ParsedRule, ConversionResult } from '../types/audit';
import { GeminiService } from './geminiService';

export class RuleParser {
  private static geminiService = new GeminiService();

  static async parseInstruction(instruction: string): Promise<ConversionResult> {
    if (!instruction.trim()) {
      return {
        success: false,
        error: 'Instruction cannot be empty',
        suggestions: ['Please provide a clear audit instruction']
      };
    }

    try {
      // Use Gemini service for parsing
      return await this.geminiService.parseInstruction(instruction);
    } catch (error) {
      console.error('Rule parsing error:', error);
      return {
        success: false,
        error: `Failed to parse instruction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Check your internet connection',
          'Verify your Gemini API key is configured correctly',
          'Try simplifying your instruction'
        ]
      };
    }
  }

  static getParserStatus() {
    return this.geminiService.getStatus();
  }

  static isGeminiAvailable(): boolean {
    return this.geminiService.isGeminiAvailable();
  }
}