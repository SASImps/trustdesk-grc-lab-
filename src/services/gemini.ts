export async function analyzeRisk(riskDescription: string) {
  try {
    const response = await fetch('/api/analyze-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riskDescription })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}
