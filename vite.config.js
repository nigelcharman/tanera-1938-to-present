import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

function aboutPrettyUrl() {
  return {
    name: "about-pretty-url",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/about" || req.url?.startsWith("/about?")) {
          req.url = "/about.html";
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/about" || req.url?.startsWith("/about?")) {
          req.url = "/about.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [aboutPrettyUrl()],
  server: {
    host: "0.0.0.0",
    port: 4321,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4321,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        about: resolve(rootDir, "about.html"),
      },
    },
  },
});
