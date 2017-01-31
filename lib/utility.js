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
 * Exports common-purpose utilities to become part of library API.
 *
 * @param {LibraryApi} Library refers to resulting library API incl. exported part later
 * @param {ProcessedOptions} Options
 * @returns {UtilityLibraryApi}
 */
module.exports = function( Library, Options ) {
	return /** @lends UtilityLibraryApi */ {
		/**
		 * Merges provided set of arguments with unprocessed options provided on
		 * invoking sails-qualify.
		 *
		 * @param {{options:object<string,*>}} localArgs arguments to be extended
		 * @returns {{options:object<string,*>}} extended arguments
		 */
		qualifyArguments: function( localArgs ) {
			if ( !localArgs ) {
				localArgs = {
					options: {}
				};
			}

			Object.keys( Options.unprocessed )
				.forEach( function( name ) {
					if ( !localArgs.options.hasOwnProperty( name ) ) {
						localArgs.options[name] = Options.unprocessed[name];
					}
				} );

			return localArgs;
		},

		/**
		 * @typedef {object} DetectedProjectConfiguration
		 * @property {string} styleMode one out of "less" or "sass" or "scss"
		 * @property {string} viewMode one out of "jst" or "jade" or "pug"
		 * @property {string} viewExtension one out of "html" or "jade" or "pug"
		 * @property {string} viewType one out of "html" or "pug"
		 */

		/**
		 * Detects aspects of sails project's current configuration.
		 *
		 * @returns {Promise.<DetectedProjectConfiguration>}
		 */
		detectConfiguration: function() {
			return Library.file.read( "tasks/register/compileAssets.js" )
				.then( function( code ) {
					let config = {};

					code = String( code );

					let match = code.match( /(["'])(s[ca]ss|less):.+?\1/ );
					if ( !match ) {
						throw new Error( "Can't detect whether LESS or SCSS is used." );
					}

					config.styleMode = match[2];

					match = code.match( /(["'])(jst|jade|pug):.+?\1/ );
					if ( !match ) {
						throw new Error( "Can't detect whether JST or PUG/JADE is used." );
					}

					config.viewMode = match[2];

					switch ( config.viewMode ) {
						case "jst" :
							config.viewExtension = "ejs";
							config.viewType = "html";
							break;

						case "pug" :
						case "jade" :
							config.viewExtension = config.viewMode;
							config.viewType = "pug";
							break;

						default :
							throw new Error( "unsupported type of view files" );
					}

					return config;
				} );
		}
	};
};
