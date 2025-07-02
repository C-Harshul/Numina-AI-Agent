import { ConversionResult } from '../types/audit';
import { apiClient } from './apiClient';

export class RuleParser {
  static async parseInstruction(instruction: string): Promise<ConversionResult> {
    if (!instruction.trim()) {
      return {
        success: false,
        error: 'Instruction cannot be empty',
        suggestions: ['Please provide a clear audit instruction']
      };
    }

    try {
      const response = await apiClient.parseInstruction(instruction);
      return response;
    } catch (error) {
      console.error('Rule parsing error:', error);
      return {
        success: false,
        error: `Failed to parse instruction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Check your internet connection',
          'Verify the backend server is running',
          'Try simplifying your instruction'
        ]
      };
    }
  }

  static async getParserStatus() {
    try {
      const response = await apiClient.getGeminiStatus();
      return response.data;
    } catch (error) {
      console.error('Failed to get parser status:', error);
      return { available: false, apiKey: false };
    }
  }

  static async isGeminiAvailable(): Promise<boolean> {
    try {
      const status = await this.getParserStatus();
      return status.available;
    } catch {
      return false;
    }
  }
}