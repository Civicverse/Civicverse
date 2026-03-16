const http = require('http');

class AIService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434/api/generate';
    this.model = 'phi3:mini'; // Using phi3:mini for faster inference in dev
  }

  async verifyJobProof(jobDescription, proofText) {
    const prompt = `
      You are an AI verification node for Civicverse, a decentralized civic engagement platform.
      Your task is to verify if a user's proof of work matches the job description.

      Job Description: ${jobDescription}
      User's Submitted Proof: ${proofText}

      Analyze the proof. Does it reasonably demonstrate that the job was completed?
      
      Respond ONLY with a JSON object in the following format:
      {
        "verified": true/false,
        "confidence": 0.0 to 1.0,
        "reasoning": "Short explanation of your decision"
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
        hostname: 'localhost',
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
