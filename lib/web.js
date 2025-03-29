export const web = {
    search: async (query) => {
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
  
        if (!response.ok) throw new Error(data.error || "Gagal mengambil hasil pencarian");
  
        return data;
      } catch (error) {
        console.error("Error fetching search results:", error);
        return { error: "Terjadi kesalahan dalam pengambilan data." };
      }
    },
  };
  