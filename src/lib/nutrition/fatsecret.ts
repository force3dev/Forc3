import type { FoodResult } from "./types";

export async function searchFatSecret(query: string): Promise<FoodResult[]> {
  if (!process.env.FATSECRET_CLIENT_ID || !process.env.FATSECRET_CLIENT_SECRET) return [];

  try {
    const tokenResponse = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials&scope=basic",
      signal: AbortSignal.timeout(5000),
    });
    const { access_token } = await tokenResponse.json();

    const response = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&max_results=10`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await response.json();

    return (data.foods?.food || []).map((food: any): FoodResult => {
      const desc = food.food_description || "";
      const calMatch = desc.match(/Calories:\s*([\d.]+)/);
      const fatMatch = desc.match(/Fat:\s*([\d.]+)g/);
      const carbMatch = desc.match(/Carbs:\s*([\d.]+)g/);
      const protMatch = desc.match(/Protein:\s*([\d.]+)g/);

      return {
        id: `fs-${food.food_id}`,
        name: food.food_name,
        brand: food.brand_name || undefined,
        calories: calMatch ? Math.round(parseFloat(calMatch[1])) : 0,
        fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
        carbs: carbMatch ? parseFloat(carbMatch[1]) : 0,
        protein: protMatch ? parseFloat(protMatch[1]) : 0,
        servingSize: 1,
        servingUnit: "serving",
        source: "fatsecret",
        verified: true,
      };
    });
  } catch {
    return [];
  }
}
