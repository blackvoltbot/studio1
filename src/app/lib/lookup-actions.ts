'use server';

export async function performLookup(number: string) {
  const apiKey = 'toxicadminn';
  const url = `http://number-free1year.vercel.app/?apikey=${apiKey}&number=${number}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Lookup failed with status ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('Lookup API Error:', error);
    return { success: false, error: error.message || 'Unknown network error' };
  }
}
