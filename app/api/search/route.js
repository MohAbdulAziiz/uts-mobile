export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ error: "Query diperlukan" }), { status: 400 });
  }

  try {
    const googleSearchAPI = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=AIzaSyCSCN_UrCQsg6UWKJx1ABy4oCRVnujw1eg&cx=97cc3761f47e544b5`;

    const searchResults = await fetch(googleSearchAPI);
    if (!searchResults.ok) throw new Error("Gagal mengambil hasil pencarian");

    const data = await searchResults.json();
    
    // Pastikan hanya mengirim hasil pencarian yang bisa dirender
    return new Response(JSON.stringify({ result: data.items || [] }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error("Error fetching search results:", error);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan dalam pengambilan data" }), { status: 500 });
  }
}
