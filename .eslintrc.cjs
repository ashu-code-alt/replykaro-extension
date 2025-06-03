module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  // Declare 'chrome' and 'axios' as global read-only variables
  globals: {
    chrome: "readonly",
    axios: "readonly"
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module"
  },
  rules: {
    "no-unused-vars": "warn",
    "no-console": "off"
  }
};
