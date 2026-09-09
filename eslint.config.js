import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'arrow-parens': ['error', 'always'],
      'prefer-const': 'error',
      'no-eval': 'error',
      'no-trailing-spaces': 'error',
      'no-var': 'error',
      'quotes': [
        'error',
        'single',
        {
          'allowTemplateLiterals': true
        }
      ],
      'semi': 'error',
      'comma-dangle': [
        'error',
        'always-multiline'
      ],
      'eqeqeq': 'error',
      'no-useless-escape': 'off',
      // Enabled by default in ESLint 10, but it fires on "declare with a
      // default, then overwrite conditionally" — the shape of nearly every
      // geometry routine here, and TypeScript rejects dropping the
      // initializer because the value is only assigned inside a branch.
      // path-data.ts is additionally kept byte-equivalent to its upstream.
      'no-useless-assignment': 'off',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
);
