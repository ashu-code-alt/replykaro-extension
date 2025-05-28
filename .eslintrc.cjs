module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  globals: {
    axios: 'readonly'    // acknowledge axios from your <script> tag
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-unused-vars': ['warn'],
    'no-console': ['off']
  }
};
