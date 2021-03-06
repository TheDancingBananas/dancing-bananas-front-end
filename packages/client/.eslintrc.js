const path = require('path');

module.exports = {
    root: true,
    env: {
        es2021: true,
        browser: true,
        node: true,
    },
    parserOptions: {
        project: path.join(__dirname, './tsconfig.json'),
        sourceType: 'module',
    },
    extends: [
        '../.eslintrc.json',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn'],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
