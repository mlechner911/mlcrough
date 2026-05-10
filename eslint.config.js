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
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
);
