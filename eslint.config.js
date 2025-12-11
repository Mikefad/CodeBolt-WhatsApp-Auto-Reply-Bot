const pluginJs = require('@eslint/js');
const globals = require('globals');
const pluginImport = require('eslint-plugin-import');

module.exports = [
  {
    ignores: ['node_modules/**']
  },
  pluginJs.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      import: pluginImport
    },
    rules: {
      'no-console': 'off'
    }
  }
];