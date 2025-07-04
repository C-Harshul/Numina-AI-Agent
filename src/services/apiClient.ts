class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Rule endpoints
  async getRules(activeOnly = false) {
    const query = activeOnly ? '?active=true' : '';
    return this.request(`/rules${query}`);
  }

  async getRule(id: string) {
    return this.request(`/rules/${id}`);
  }

  async createRule(parsedRule: any, originalInstruction: string, createdBy = 'user') {
    return this.request('/rules', {
      method: 'POST',
      body: JSON.stringify({
        parsedRule,
        originalInstruction,
        createdBy
      }),
    });
  }

  async updateRule(id: string, updates: any) {
    return this.request(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRule(id: string) {
    return this.request(`/rules/${id}`, {
      method: 'DELETE',
    });
  }

  async getRuleVersions(ruleType: string) {
    return this.request(`/rules/versions/${ruleType}`);
  }

  async rollbackRule(ruleType: string, version: number) {
    return this.request(`/rules/rollback/${ruleType}/${version}`, {
      method: 'POST',
    });
  }

  async exportRules() {
    return this.request('/rules/export/all');
  }

  async importRules(rules: any[]) {
    return this.request('/rules/import', {
      method: 'POST',
      body: JSON.stringify({ rules }),
    });
  }

  async clearAllRules() {
    return this.request('/rules/clear/all', {
      method: 'DELETE',
    });
  }

  async getRuleStats() {
    return this.request('/rules/stats/overview');
  }

  // Gemini endpoints
  async getGeminiStatus() {
    return this.request('/gemini/status');
  }

  async parseInstruction(instruction: string, realmId: string, accessToken: string, entity: string) {
    return this.request('/gemini/parse', {
      method: 'POST',
      body: JSON.stringify({ instruction, realmId, accessToken, entity }),
    });
  }
}

export const apiClient = new ApiClient();