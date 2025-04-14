// .eslintrc.js
module.exports = {
    extends: [
      'next/core-web-vitals',
      'next/typescript'
    ],
    rules: {
      // Set the no-explicit-any rule to warn instead of error
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Reduce severity for unused vars (still shows warnings but won't fail build)
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      
      // Disable some rules that aren't critical for building
      '@next/next/no-img-element': 'warn',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }