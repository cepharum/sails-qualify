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
 * Exports library for reading and adjusting view files.
 *
 * @param {LibraryApi} Library refers to resulting library API incl. exported part later
 * @param {ProcessedOptions} Options
 * @returns {ViewLibraryApi}
 */
module.exports = function( Library, Options ) {

	let processors = {
		html: htmlProcessor,
		pug: pugProcessor
	};



	/**
	 * @typedef {object} ViewUtilityOptionsComplex
	 * @property {string} element name of HTML/PUG element to search
	 * @property {string} [attribute] name of attribute to process per element
	 * @property {boolean} [all] set true to process all matching elements, omit
	 *           for processing first matching element, only
	 */

	/**
	 * Names attribute to search and process.
	 *
	 * First matching attribute of any element is processed, only.
	 *
	 * @typedef {string} ViewUtilityOptionsSimple
	 */

	/**
	 * @typedef {ViewUtilityOptionsSimple|ViewUtilityOptionsComplex} ViewUtilityOptions
	 */



	return /** @lends ViewLibraryApi */ {

		/**
		 * Processes matching attribute(s) in selected view file.
		 *
		 * @note View file must be named w/o file extension as it is appended
		 *       depending on current project's configuration internally.
		 *
		 * @param {string} viewFilenameWithoutExtension filename w/o extension
		 *        of view file to process
		 * @param {ViewUtilityOptions=} options
		 * @param {function(attributeValue:string=):string} fn callback invoked
		 *        for processing and probably modifying found attribute value,
		 *        it is invoked w/o arguments on matching elements lacking
		 *        selected attribute to support adding attribute
		 * @returns {Promise}
		 */
		processAttribute: function processAttribute( viewFilenameWithoutExtension, options, fn ) {
			options = normalizeOptions( options );

			return Library.utility.detectConfiguration()
				.then( function( config ) {
					let filename = viewFilenameWithoutExtension + "." + config.viewExtension;
					let handler  = processors[config.viewType].bind( undefined, options, fn );

					return Library.file.modify( filename, handler );
				} );
		},

		/**
		 * Reads matching attribute(s) from selected view file.
		 *
		 * @note View file must be named w/o file extension as it is appended
		 *       depending on current project's configuration internally.
		 *
		 * @param {string} viewFilenameWithoutExtension filename w/o extension
		 *        of view file to process
		 * @param {ViewUtilityOptions=} options
		 * @returns {Promise}
		 */
		readAttribute: function readAttribute( viewFilenameWithoutExtension, options ) {
			options = normalizeOptions( options );

			return Library.utility.detectConfiguration()
				.then( function( config ) {
					let results  = [];
					let filename = viewFilenameWithoutExtension + "." + config.viewExtension;
					let handler  = processors[config.viewType].bind( undefined, options, reader );

					return Library.file.read( filename )
						.then( handler )
						.then( function() {
							return options.all ? results : results.shift();
						} );


					function reader( element, value ) {
						if ( arguments.length > 1 ) {
							results.push( value );
						}
					}
				} );
		}
	};



	function normalizeOptions( options ) {
		if ( options && typeof options === "string" ) {
			options = {
				element: null,
				attribute: options,
				all: false,
			};
		}

		if ( !options || !options.attribute ) {
			throw new TypeError( "missing name of attribute to process" );
		}

		return options;
	}

	/**
	 * Searches HTML syntax for matching attributes in optionally selected
	 * elements to process and replace values of found attributes.
	 *
	 * @param {ViewUtilityOptions} options
	 * @param {function(elementName:string, attributeValue:string=):?string} callback
	 * @param {string} code HTML code to process
	 * @returns {string} processed HTML code
	 */
	function htmlProcessor( options, callback, code ) {
		let element,
			attribute,
			matchCount = 0;

		if ( options.element ) {
			element = new RegExp( "(<" + options.element + ")(?:(\\s+)([^>]*))?(/?>)", "gi" );
		} else {
			element = /(<\S+)(?:(\s+)([^>]*))?(\/?>)/gi;
		}

		attribute = new RegExp( "((?:^|\\s+)" + options.attribute + "=)(?:([\"'])([\\s\\S]*?)\\2|(\\S*))", "i" );

		return String( code || "" )
			.replace( element, function( eAll, eTag, ePre, eAttributes, ePost ) {
				if ( !options.all && matchCount > 0 ) {
					return eAll;
				}

				if ( typeof ePre !== "string" ) {
					ePre = " ";
				}

				if ( typeof eAttributes !== "string" ) {
					eAttributes = "";
				}

				let elementName = eTag.slice( 1 );

				let matched = false;
				let processed = eAttributes
					.replace( attribute, function( aAll, aName, aQuote, aQuotedValue, aRawValue ) {
						matched = true;

						let value;

						if ( typeof aQuotedValue === "string" ) {
							value = aQuotedValue;
						} else {
							value = aRawValue || "";
						}

						value = callback( elementName, value );
						if ( value === undefined || value === null ) {
							return "";
						}

						return aName + '"' + String( value ).replace( /"/g, "&quot;" ) + '"';
					} );


				if ( matched ) {
					matchCount++;
				} else {
					// add attribute missing in element?
					let value = callback( elementName );
					if ( typeof value === "string" ) {
						matchCount++;

						value = options.attribute + '="' + value.replace( /"/g, "&quot;" ) + '"';

						processed = processed.trim();
						if ( processed.length ) {
							processed += " " + value;
						} else {
							processed  = value;
						}
					}
				}

				return eTag + ePre + processed + ePost;
			} );
	}

	/**
	 * Searches PUG syntax for matching attributes in optionally selected
	 * elements to process and replace values of found attributes.
	 *
	 * @param {ViewUtilityOptions} options
	 * @param {function(elementName:string, attributeValue:string=):?string} callback
	 * @param {string} code PUG code to process
	 * @returns {string} processed PUG code
	 */
	function pugProcessor( options, callback, code ) {
		let element,
			attribute,
			matchCount = 0;

		if ( options.element ) {
			element = new RegExp( "(\\r?\\n[ \\t]*" + options.element + "[^(\\s]*)(?:\\(([^)]*)\\))?(\\s|$)", "gi" );
		} else {
			element = /(\r?\n[ \t]*[a-z_][^(\s]*)(?:\(([^)]*)\))?(\s|$)/gi;
		}

		attribute = new RegExp( "((?:^|,)\s*" + options.attribute + "=)(?:([\"'])([\\s\\S]*?)\\2|(\\S*))", "i" );

		return String( code || "" )
			.replace( element, function( eAll, eTag, eAttributes, ePost ) {
				if ( !options.all && matchCount > 0 ) {
					return eAll;
				}

				if ( typeof eAttributes !== "string" ) {
					eAttributes = "";
				}

				let elementName = eTag.trim().split( /[#.]/ ).shift().trim();

				let matched = false;
				let processed = eAttributes
					.replace( attribute, function( aAll, aName, aQuote, aQuotedValue, aRawValue ) {
						matched = true;

						let value;

						if ( typeof aQuotedValue === "string" ) {
							value = aQuotedValue;
						} else {
							value = aRawValue || "";
						}

						value = callback( elementName, value );
						if ( value === undefined || value === null ) {
							return "";
						}

						return aName + '"' + String( value ).replace( /"/g, "&quot;" ) + '"';
					} );

				if ( matched ) {
					matchCount++;
				} else {
					let value = callback( elementName );
					if ( typeof value === "string" ) {
						matchCount++;

						value = options.attribute + '="' + value.replace( /"/g, "&quot;" ) + '"';

						processed = processed.trim();
						if ( processed.length ) {
							processed += "," + value;
						} else {
							processed  = value;
						}
					}
				}

				processed = processed.trim();
				if ( processed.length ) {
					processed = "(" + processed + ")";
				}

				return eTag + processed + ePost;
			} );
	}
};
