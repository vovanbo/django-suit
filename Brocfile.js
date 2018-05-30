const Merge = require("broccoli-merge-trees");
const CompileSass = require("broccoli-sass-source-maps");

const appRoot = "suit";

const css = new CompileSass(
    [appRoot],
    "sass/suit.scss",
    "static/suit/css/suit.css",
    {
        annotation: "Django Suit Sass files",
        importer: require('npm-sass').importer
    }
);

module.exports = Merge([css], {annotation: "Final output"});