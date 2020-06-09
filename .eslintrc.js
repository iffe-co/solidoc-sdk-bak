// eslint config
// https://cn.eslint.org/

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'no-console': 0,
    'no-cond-assign': 0,
    'no-unused-vars': 0,
    'no-case-declarations': 0,
    'no-extra-semi': 'warn',
    semi: 'warn',
  },
  extends: [
    'eslint:recommended',
    'plugin:import/typescript',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
};
