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

module.exports = function( Vorpal, Lib ) {

	Vorpal
		.command( "angular", "Prepares for developing client with AngularJS 1.x." )
		.action( angularAction );

	return {
		action: angularAction
	};


	function angularAction( args ) {
		let self = this;

		args = Lib.utility.qualifyArguments( args );

		return Vorpal.exec( "bower" )
			.then( function() {
				return Lib.file.read( "tasks/register/compileAssets.js" )
					.then( function( code ) {
						let match = code.match( /("')(s[ca]ss|less):.+?\1/ );
						if ( match ) {
							return match[2]
						}

						throw new Error( "Can't detect whether LESS or SCSS is used." );
					} );
			} )
			.then( function( styleMode ) {
				if ( styleMode == "less" ) {
					// ensure to have injection markers in importer.less
					return Lib.file.modify( "assets/styles/importer.less", function( content ) {
						content = content.toString();

						// TODO insert injection markers unless found in content

						return content;
					} )
						.then( function() {
							return "less";
						} );
				}

				return "scss";
			} )
			.then( function( styleMode ) {

			} )
			.then( () => this.log( "Enabled AngularJS 1.x based client." ) );
	}
};
