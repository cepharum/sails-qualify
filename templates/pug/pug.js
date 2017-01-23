/**
 * `pug`
 *
 * ---------------------------------------------------------------
 *
 * Converts pug-formatted template files into HTML files or JST-style template
 * functions.
 *
 * For usage docs see:
 *   https://github.com/gruntjs/grunt-contrib-pug
 *
 */

module.exports = function( grunt ) {
	grunt.config.set( "<%= mode %>", {
		dev: {
			options: {
				client:      true,
				processName: function( filename ) {
					return filename.replace( /^assets\/components\/|\.(jade|pug)$/g, "" );
				}
			},
			files:   {
				".tmp/public/jst.js": require( "../pipeline" ).templateFilesToInject
			}
		}
	} );

	grunt.loadNpmTasks( "grunt-contrib-<%= mode %>" );
};
