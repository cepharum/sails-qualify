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
 * Exports validator library to become part of library API.
 *
 * @param {LibraryApi} Library refers to resulting library API incl. exported part later
 * @param {ProcessedOptions} Options
 * @returns {ValidatorLibraryApi}
 */
module.exports = function( Library, Options ) {

	return /** @lends ValidatorLibraryApi */ {
		/**
		 * Tests if selected project by means of some selected project's folder
		 * is a sailsjs-based project or not.
		 *
		 * @param {boolean=} throwOnFailed set true to implicitly reject if project isn't sails-based
		 * @returns {Promise.<boolean>} true if project is sails-based, false otherwise (unless setting `throwOnFailed`)
		 */
		isSailsProject: function( throwOnFailed ) {
			return Library.meta.readPackageJson()
				.then( function( info ) {
					if ( !info.dependencies.sails ) {
						if ( throwOnFailed ) {
							throw new Error( "not a sails project to qualify" );
						}

						return false;
					}

					return true;
				} );
		}
	};
};
