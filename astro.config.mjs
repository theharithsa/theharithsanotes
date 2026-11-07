import { defineConfig } from "astro/config";
import node from "@astrojs/node";

const functions = process.env.CMS_BUILD_TARGET === "firebase";
const server = functions || process.env.CMS_BUILD_TARGET === "server";

export default defineConfig({
  site: "https://theharithsanotes.com",
  output: server ? "server" : "static",
  ...(server
    ? { adapter: node({ mode: functions ? "middleware" : "standalone" }) }
    : {}),
  trailingSlash: "never",
  devToolbar: { enabled: false },
});
