/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

/**
 *
 * @param Vorpal
 * @param {LibraryApi} Lib
 */
module.exports = function( Vorpal, Lib ) {

	Vorpal
		.command( "scss", "Switches to SCSS for styling." )
		.alias( "sass" )
		.option( "--pushy", "Remove files not in use anymore after adjusting." )
		.action( scssAction );

	return {
		action: scssAction
	};


	function scssAction( args ) {
		let self = this;

		args = Lib.utility.qualifyArguments( args );

		return Lib.validator.isSailsProject( true )
			.then( function() {
				return Lib.meta.installDependency( "grunt-sass" );
			} )
			.then( function() {
				return Lib.file.writeTemplate( "scss/importer.scss", "assets/styles/importer.scss" );
			} )
			.then( function() {
				return Lib.file.isFile( "tasks/config/less-angular.js", function() {
					return Lib.file.writeTemplate( "angular/scss-angular.js", "tasks/config/scss-angular.js" );
				} );
			} )
			.then( function() {
				return Lib.file.writeTemplate( "scss/scss.js", "tasks/config/scss.js" );
			} )
			.then( function() {
				return Lib.file.modify( "tasks/register/compileAssets.js", adjustAssetTask );
			} )
			.then( function() {
				return Lib.file.modify( "tasks/register/syncAssets.js", adjustAssetTask );
			} )
			.then( function() {
				if ( args.options.pushy ) {
					return Promise.all( [
						Lib.file.remove( "assets/styles/importer.less" ),
						Lib.file.remove( "tasks/config/less.js" ),
						Lib.file.remove( "tasks/config/less-angular.js" )
					] );
				}
			} )
			.then( () => this.log( "Switched to SCSS." ) );
	}

	function adjustAssetTask( code ) {
		code = code.toString();

		code = code.replace( /(["'])less(-angular)?(:.+?)\1/g, function( all, quote, task, mode ) {
			return quote + "sass" + ( task || "" ) + mode + quote;
		} );

		return Buffer.from( code );
	}
};
