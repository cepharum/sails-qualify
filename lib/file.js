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

const Path = require( "path" );
const File = require( "fs" );


module.exports = function( Library, Options ) {
	return {
		/** @borrows readFile */
		read: readFile,

		/**
		 * Reads JSON-encoded file.
		 *
		 * @param {string} filename
		 * @returns {Promise<object>}
		 */
		readJSON: function( filename ) {
			return readFile( filename )
				.then( ( content ) => JSON.parse( String( content ) ) );
		},

		/** @borrows writeFile */
		write: writeFile,

		/**
		 * Writes given object into JSON-encoded file.
		 *
		 * @param {string} filename name of file to write into
		 * @param {object} object data object to write
		 * @returns {Promise<object>} promises object successfully written to file
		 */
		writeJSON: function( filename, object ) {
			return writeFile( filename, JSON.stringify( object, null, "\t" ) )
				.then( () => object );
		},

		/** @borrows stat */
		stat: stat,

		/** @borrows createFolder */
		createFolder: createFolder,

		/**
		 * Creates some folder and all parent folders missing.
		 *
		 * @param {string} pathname
		 * @returns {Promise}
		 */
		createFolders: function( pathname ) {
			return _create( pathname );

			function _create( pathname ) {
				return stat( pathname )
					.catch( function( cause ) {
						if ( cause.code === "ENOENT" ) {
							return false;
						} else {
							throw cause;
						}
					} )
					.then( function( stat ) {
						if ( stat ) {
							if ( !stat.isDirectory() ) {
								throw new Error( "non-folder exists already" );
							}

							return;
						}

						return createFolder( pathname )
							.catch( function() {
								let parentName = Path.dirname( pathname );
								if ( !parentName.length ) {
									throw new Error( "creating parent folders failed" );
								}

								return _create( parentName )
									.then( () => createFolder( pathname ) );
							} )
					} );
			}
		},

		writeTemplate: function( templateName, filename, data ) {
			
		}
	};


	/**
	 * Reads selected file's content.
	 *
	 * @param {string} filename
	 * @returns {Promise<Buffer>} promises content read from file
	 */
	function readFile( filename ) {
		return new Promise( function( resolve, reject ) {
			File.readFile( Path.resolve( Options.switches.projectDir, filename ), function( err, content ) {
				if ( err ) {
					reject( err );
				} else {
					resolve( content );
				}
			} );
		} );
	}

	/**
	 * Writes content to selected file.
	 *
	 * @param {string} filename
	 * @param {string|Buffer} content
	 * @returns {Promise<string|Buffer>} promises content written to file
	 */
	function writeFile( filename, content ) {
		return new Promise( function( resolve, reject ) {
			File.writeFile( Path.resolve( Options.switches.projectDir, filename ), content, function( err ) {
				if ( err ) {
					reject( err );
				} else {
					resolve( content );
				}
			} );
		} );
	}

	/**
	 * Stats selected file.
	 *
	 * @param {string} filename
	 * @returns {Promise<Stats>} promises stats of found file
	 */
	function stat( filename ) {
		return new Promise( function( resolve, reject ) {
			File.stat( Path.resolve( Options.switches.projectDir, filename ), function( err, stat ) {
				if ( err ) {
					reject( err );
				} else {
					resolve( stat );
				}
			} );
		} );
	}

	/**
	 * Creates folder selected by its pathname to be.
	 *
	 * @param {string} pathname path name of folder to create
	 * @returns {Promise} promises successful creation of folder
	 */
	function createFolder( pathname ) {
		return new Promise( function( resolve, reject ) {
			File.mkdir( Path.resolve( Options.switches.projectDir, pathname ), function( err ) {
				if ( err ) {
					reject( err );
				} else {
					resolve();
				}
			} );
		} );
	}
};
