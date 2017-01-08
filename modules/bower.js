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

const _ = require( "lodash" );


module.exports = function( Vorpal, Lib ) {

	Vorpal
		.command( "bower", "Adjusts sailsjs project to use bower for managing client-side assets." )
		.option( "-j, --json", "Update existing bower.json file." )
		.option( "-r, --rc", "Update existing .bowerrc file." )
		.action( function( args ) {
			let self = this;

			args = Lib.utility.qualifyArguments( args );

			return Lib.validator.isSailsProject()
				.then( function( isSailsProject ) {
					if ( !isSailsProject ) {
						throw new Error( "not a sails project to qualify" );
					}

					return Lib.command.invoke( "?bower -v" )
						.catch( function( cause ) {
							switch ( cause.code ) {
								case "ENOENT" :
									return Lib.command.invoke( "?npm install --save -g bower" );

								default :
									throw cause;
							}
						} )
						.then( () => Lib.meta.readPackageJson() )
						.then( function( npmConfig ) {
							return Lib.meta.readBowerJson()
								.catch( () => false )
								.then( function( bowerConfig ) {
									if ( !bowerConfig || args.options.json ) {
										self.log( "writing bower.json" );
										return Lib.meta.writeBowerJson( _.extend( bowerConfig || {}, {
											name:        bowerConfig.name || npmConfig.name || "",
											description: bowerConfig.description || npmConfig.description || "",
											authors:     bowerConfig.authors || [npmConfig.author],
											license:     bowerConfig.license || npmConfig.license,
											private:     bowerConfig.private || npmConfig.private || false,
											ignore:      bowerConfig.ignore || [
												"**/.*",
												"node_modules",
												"bower_components",
												"test",
												"tests"
											],
										} ) );
									}
								} )
								.then( () => Lib.meta.readBowerRc() )
								.catch( () => false )
								.then( function( bowerConfig ) {
									if ( !bowerConfig || args.options.rc ) {
										self.log( "writing .bowerrc" );
										return Lib.meta.writeBowerRc( _.extend( bowerConfig || {}, {
											directory: bowerConfig.directory || "assets/dependencies",
										} ) );
									}
								} );
						} );
				} )
				.then( () => null );
		} );

};
