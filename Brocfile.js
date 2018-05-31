const Funnel = require('broccoli-funnel');
const Merge = require("broccoli-merge-trees");
const EsLint = require("broccoli-lint-eslint");
const CompileSass = require("broccoli-sass-source-maps");
const CleanCss = require('broccoli-clean-css');
const BrowserSync = require('broccoli-bs');
const Rollup = require("broccoli-rollup");
const babel = require("rollup-plugin-babel");
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const log = require('broccoli-stew').log;

const appRoot = "suit";

const rollupPlugins = [
    nodeResolve({
        jsnext: true,
        browser: true,
    }),
    commonjs({
        include: 'node_modules/**',
        sourceMap: true
    }),
    babel({
        exclude: 'node_modules/**',
        presets: ['es2015-rollup'],
        plugins: ['external-helpers'],
        runtimeHelpers: true,
        babelrc: false
    }),
    // uglify()
];

let js = new EsLint.create(appRoot, {persist: true});

js = new Rollup(js, {
    inputFiles: ["frontend/js/*.js"],
    annotation: 'JS Transformation',
    rollup: {
        input: 'frontend/js/suit.js',
        output: {
            file: 'js/suit.min.js',
            format: 'iife',
            name: 'Suit',
            globals: {
                jquery: 'django.jQuery',
            },
            sourcemap: true,
        },
        plugins: rollupPlugins
    }
});


const vendors = new Funnel(
    'node_modules',
    {
        srcDir: 'autosize/dist',
        include: ['*.min.js'],
        destDir: 'js',
        annotation: 'NPM vendor files',
    }
);

const fonts = new Funnel(
    'node_modules/font-awesome',
    {
        srcDir: 'fonts',
        destDir: 'fonts',
        annotation: 'Font Awesome files'
    }
);

// let css = new SassLint(appRoot, {
//     disableTestGenerator: true,
// });

let css = new CompileSass(
    [appRoot],
    "frontend/sass/suit.scss",
    "css/suit.css",
    {
        annotation: "Django Suit Sass files",
        importer: require('npm-sass').importer,
        sourceMap: true,
        sourceMapContents: true,
    }
);

let tree = log(
    Merge([css, js, vendors, fonts], {annotation: "Final output"}),
    {
        output: 'tree'
    }
);

const browserSync = new BrowserSync(tree, {
    bs: {
        proxy: 'http://localhost:8000',
        open: false
    }
});

module.exports = Merge([tree, browserSync]);
