'use server';

/**
 * Performs a mobile intelligence lookup using the external provider.
 * @param number The target phone number to investigate.
 */
export async function performLookup(number: string) {
  const apiKey = 'toxicadminn';
  // Use HTTPS for secure communication with the provider
  const url = `https://number-free1year.vercel.app/?apikey=${apiKey}&number=${number}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 0 } // Bypass Next.js cache for live results
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No response body');
      console.error(`[BLACK DETAIL] API HTTP Error: ${response.status}`, errorBody);
      throw new Error(`Operational link returned status ${response.status}`);
    }

    const data = await response.json();

    // Check if the API reported success: false within the valid JSON response
    if (data && data.success === false) {
      console.warn('[BLACK DETAIL] API Payload reported failure:', data.message || 'Unknown provider error');
      return { 
        success: false, 
        error: data.message || data.error || 'Provider failed to retrieve data for this target.' 
      };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('[BLACK DETAIL] Lookup System Error:', error.message);
    return { success: false, error: error.message || 'Secure link established but no data returned.' };
  }
}
