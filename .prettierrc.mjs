// All of these are defaults except singleQuote, but we specify them
// for explicitness
const config = {
    quoteProps: 'as-needed',
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    endOfLine: 'auto',
    plugins: ['prettier-plugin-packagejson'],
};

export default config;
