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


/**
 * Exports library for accessing meta data files to become part of library API.
 *
 * @param {LibraryApi} Library refers to resulting library API incl. exported part later
 * @param {ProcessedOptions} Options
 * @returns {MetaLibraryApi}
 */
module.exports = function( Library, Options ) {
	return /** @lends MetaLibraryApi */ {
		readPackageJson:  () => Library.file.readJSON( "package.json" ),
		readSailsRc:      () => Library.file.readJSON( ".sailsrc" ),
		readBowerJson:    () => Library.file.readJSON( "bower.json" ),
		readBowerRc:      () => Library.file.readJSON( ".bowerrc" ),
		writePackageJson: ( object ) => Library.file.writeJSON( "package.json", object || {} ),
		writeSailsRc:     ( object ) => Library.file.writeJSON( ".sailsrc", object || {} ),
		writeBowerJson:   ( object ) => Library.file.writeJSON( "bower.json", object || {} ),
		writeBowerRc:     ( object ) => Library.file.writeJSON( ".bowerrc", object || {} ),

		/**
		 * Installs selected dependencies if missing.
		 *
		 * @param {string[]} modules
		 * @param {boolean=} installForDevelopment true to save any missing dependency as dev-only one
		 * @param {boolean=} temporary true to install dependency w/o saving
		 * @returns {*}
		 */
		installDependency: function( modules, installForDevelopment, temporary ) {
			if ( !Array.isArray( modules ) ) {
				if ( modules && typeof modules === "string" ) {
					modules = [modules];
				} else {
					return Promise.resolve();
				}
			}

			return Library.meta.readPackageJson()
				.then( function( json ) {
					var deps    = _.extend( {}, json.dependencies, json.devDependencies ),
						missing = [],
						i, l;

					for ( i = 0, l = modules.length; i < l; i++ ) {
						if ( !deps[modules[i]] ) {
							missing.push( modules[i] );
						}
					}

					if ( missing.length ) {
						if ( !temporary ) {
							missing.unshift( installForDevelopment ? "--save-dev" : "--save" );
						}

						missing.unshift( "install" );

						return Library.command.invoke( "?npm", missing );
					}
				} );
		}
	};
};
