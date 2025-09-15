import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetNews
export async function getNews(requestBody, customHeaders = {}) {
  const res = await apiClient.post("/api/report/GetNews", requestBody, {
    headers: { ...customHeaders },
  });
  return res.data;
}
