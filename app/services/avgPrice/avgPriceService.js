import AvgPriceProcessor from "./avgPriceProcessor.js";

export default class AvgPriceService {
  static async fetchAllAvgPrices(requestBody = {}) {
    return await AvgPriceProcessor.fetchAndProcessData(requestBody);
  }
}
