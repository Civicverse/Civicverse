const aiService = require('./services/ai-service');

async function test() {
  console.log('--- Testing AI Verification (Positive) ---');
  const jobDesc = 'Clear litter from the Central Park playground area.';
  const goodProof = 'I spent 2 hours picking up plastic bottles and candy wrappers near the slides in Central Park. The area is now clean.';
  
  try {
    const result1 = await aiService.verifyJobProof(jobDesc, goodProof);
    console.log('Positive Test Result:', JSON.stringify(result1, null, 2));
  } catch (e) {
    console.error('Positive Test Failed:', e);
  }

  console.log('\n--- Testing AI Verification (Negative) ---');
  const badProof = 'I went to the mall and bought some shoes.';
  
  try {
    const result2 = await aiService.verifyJobProof(jobDesc, badProof);
    console.log('Negative Test Result:', JSON.stringify(result2, null, 2));
  } catch (e) {
    console.error('Negative Test Failed:', e);
  }
}

test();
