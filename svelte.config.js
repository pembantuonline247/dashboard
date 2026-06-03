import adapter from "@sveltejs/adapter-static";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  kit: {
    adapter: adapter({
      fallback: "index.html",
      pages: "build",
      assets: "build"
    })
  },
  vitePlugin: {
    onwarn: (warning, handler) => {
      // Suppress a11y, state_referenced_locally, and css unused selector warnings
      if (warning.code?.startsWith("a11y_") ||
          warning.code === "state_referenced_locally" ||
          warning.code?.startsWith("css_")) return;
      handler(warning);
    }
  }
};
export default config;
