/**
 * `scss`
 *
 * ---------------------------------------------------------------
 *
 * Compile your SCSS files into a CSS stylesheet.
 *
 * By default, only the `assets/styles/importer.scss` is compiled.
 * This allows you to control the ordering yourself, i.e. import your
 * dependencies, mixins, variables, resets, etc. before other stylesheets)
 *
 * For usage docs see:
 *   https://www.npmjs.com/package/grunt-sass
 *
 */
module.exports = function( grunt ) {

	grunt.config.set( "sass", {
		dev: {
			files: [{
				expand: true,
				cwd:    "assets/styles/",
				src:    ["importer.scss"],
				dest:   ".tmp/public/styles/",
				ext:    ".css"
			}]
		}
	} );

	grunt.loadNpmTasks( "grunt-sass" );
};
