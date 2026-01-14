const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  ...expoConfig, // O expoConfig geralmente é um array, usamos o spread (...)
  eslintPluginPrettierRecommended,
  {
    
ignores: ["dist/*", ".expo/*", "node_modules/*"],
    rules: {
        // TypeScript handles module resolution, so we disable this rule
        "import/no-unresolved": "off",
        // Allow using named export as default import identifier
        "import/no-named-as-default": "off",
    },
    },
    {
        rules: {
            // Se precisar de regras específicas do Prettier, elas entram aqui:
            "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
]);
