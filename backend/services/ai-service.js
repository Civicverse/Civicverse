const http = require('http');

class AIService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';
    this.model = process.env.OLLAMA_MODEL || 'gemma2:9b'; // High-accuracy 7B-class model
  }

  async verifyJobProof(jobDescription, proofText) {
    const prompt = `
      [PROTOCOL_INTEGRITY_ENFORCEMENT]
      Scope: CivicWatch Mission Verification
      Role: Stateless Executor (Human-voted rules only)

      RULESET:
      - Valid submissions must contain clear evidence of the described activity.
      - Reject any submission that is non-responsive or clearly unrelated.
      - Use professional, objective reasoning.

      MISSION: ${jobDescription}
      SUBMISSION: ${proofText}

      TASK: Verify if the submission complies with the mission parameters.
      
      Respond ONLY with this JSON structure:
      {
        "verified": boolean,
        "confidence": float (0.0-1.0),
        "reasoning": "Clear, concise technical audit log"
      }
    `;

    try {
      const response = await this.queryOllama(prompt);
      const result = JSON.parse(response);
      console.log(`[AI-Service] Verification result:`, result);
      return result;
    } catch (error) {
      console.error(`[AI-Service] Error querying Ollama:`, error.message);
      // Fallback to basic keyword matching if AI fails
      return this.fallbackVerification(jobDescription, proofText);
    }
  }

  queryOllama(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        format: 'json'
      });

      const options = {
        hostname: process.env.OLLAMA_HOST || 'ollama',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json.response);
          } catch (e) {
            reject(new Error('Invalid JSON response from Ollama'));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
    });
  }

  fallbackVerification(jobDescription, proofText) {
    console.log('[AI-Service] Using fallback verification');
    const descLower = jobDescription.toLowerCase();
    const proofLower = proofText.toLowerCase();
    
    // Very simple heuristic for demo purposes
    const keywords = descLower.split(' ').filter(w => w.length > 4);
    const matches = keywords.filter(w => proofLower.includes(w));
    
    const verified = matches.length > 0 || proofLower.length > 20;
    
    return {
      verified,
      confidence: 0.5,
      reasoning: "Fallback verification due to AI node unavailability."
    };
  }
}

module.exports = new AIService();
