import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetSubstanceUsageSummaryByMonth
export async function getSubstanceUsageSummaryByMonth(
  requestBody,
  customHeaders = {}
) {
  const res = await apiClient.post(
    "/api/report/GetSubstanceUsageSummaryByMonth",
    requestBody,
    { headers: { ...customHeaders } }
  );
  return res.data;
}
