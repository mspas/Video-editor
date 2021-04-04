export default class ApiService {
  constructor() {
    this.fetch = this.fetch.bind(this);
  }

  async fetch(url, options) {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      headers,
      ...options,
    });
    return await response.json();
  }
}
