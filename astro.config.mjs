import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://theharithsa.com",
  output: "static",
  trailingSlash: "never",
  devToolbar: { enabled: false },
});
