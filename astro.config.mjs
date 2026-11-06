import { defineConfig } from "astro/config";
import node from "@astrojs/node";

const server = process.env.CMS_BUILD_TARGET === "server";

export default defineConfig({
  site: "https://theharithsanotes.com",
  output: server ? "server" : "static",
  ...(server ? { adapter: node({ mode: "standalone" }) } : {}),
  trailingSlash: "never",
  devToolbar: { enabled: false },
});
