// api/landGeoJSON.js (ESM)
import apiClient from "./apiClient.js";

export const getLandGeoJSON = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetLandGeoJSON", requestBody, {
    headers: { ...customHeaders },
  });
  return res.data;
};
