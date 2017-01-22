/**
 * `scss`
 *
 * ---------------------------------------------------------------
 *
 * Injects SCSS files of client-side angular components into importer file to be
 * compiled.
 *
 */
module.exports = function( grunt ) {

	var PATH = require( "path" );

	grunt.config.set( "sass-angular", {
		dev: {
			files: [{
				src:  [
					"assets/components/*.scss",
					"assets/components/**/*.scss"
				],
				dest: "assets/styles/importer.scss"
			}]
		}
	} );

	grunt.task.registerMultiTask( "sass-angular", "Injects styling of angular components.", function() {
		this.files.forEach( function( pair ) {
			var code = pair.src
				.map( function( filename ) {
					if ( grunt.file.isFile( filename ) ) {
						return '@import "' + PATH.relative( PATH.dirname( pair.dest ), filename ).replace( /\\/g, '/' ) + '";\n';
					}
				} )
				.filter( function( i ) {
					return !!i;
				} )
				.join( "" );

			grunt.file.write( pair.dest,
				grunt.file.read( pair.dest )
					.replace( /(\/\/\s*SCSS-STYLES[^\n]*\n)[\s\S]*?(\/\/\s*SCSS-STYLES\s+END\b)/g, "$1" + code + "$2" )
			);
		} );
	} );
};
