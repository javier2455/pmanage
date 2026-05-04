import apiClient from "@/lib/axios";
import { businessRoutes } from "../routes/business";

export type ReverseGeocodeResult = {
  address: string;
  province: string;
  municipality: string;
};

export async function resolveAddressFromCoords(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const { data } = await apiClient.post(businessRoutes.reverseGeocode, {
      lat,
      lng,
    });
    const result = data?.data;
    if (!result || typeof result.address !== "string") return null;
    return {
      address: result.address,
      province: result.province ?? "",
      municipality: result.municipality ?? "",
    };
  } catch {
    return null;
  }
}
