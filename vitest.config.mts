import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws unless it is resolved through Next's server
      // condition. The modules under test are server modules; the guard has
      // nothing to protect here.
      "server-only": fileURLToPath(new URL("./src/lib/__tests__/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
