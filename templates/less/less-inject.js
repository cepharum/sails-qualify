/**
 * `less`
 *
 * ---------------------------------------------------------------
 *
 * Injects LESS files of client-side components into import file to be compiled.
 *
 */
module.exports = function( grunt ) {

	var PATH = require( "path" );

	grunt.config.set( "less-inject", {
		dev: {
			files: [{
				src:  [
					"assets/components/*.less",
					"assets/components/**/*.less"
				],
				dest: "assets/styles/importer.less"
			}]
		}
	} );

	grunt.task.registerMultiTask( "less-inject", "Injects rules for importing collected files", function() {
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
					.replace( /(\/\/\s*LESS-STYLES[^\n]*\n)[\s\S]*?(\/\/\s*LESS-STYLES\s+END\b)/g, "$1" + code + "$2" )
			);
		} );
	} );
};
