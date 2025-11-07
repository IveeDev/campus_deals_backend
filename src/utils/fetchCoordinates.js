import axios from "axios";

export async function fetchCoordinates(campusName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      campusName
    )}&format=json&limit=1`;

    const { data } = await axios.get(url, {
      headers: { "User-Agent": "CampusDealsApp/1.0" },
    });

    if (data.length === 0) {
      console.warn(`No coordinates found for campus: ${campusName}`);
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return null;
  }
}
