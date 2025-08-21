import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'dist/**/*.*',
            'private/**/*.*',
        ],
    },
    eslint.configs.recommended,
    {
        extends: tseslint.configs.recommendedTypeChecked,
        rules: {
            "@typescript-eslint/no-require-imports": [
                "error",
                {
                    "allow": [
                        "/config.json$"
                    ]
                }
            ],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_"
                }
            ]
        }
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.mjs', '*.mts', "tests/*.ts"],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);