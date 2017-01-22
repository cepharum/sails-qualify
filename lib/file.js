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

const _ = require( "lodash" );


/**
 * Exports file library to become part of library API.
 *
 * @param {LibraryApi} Library refers to resulting library API incl. exported part later
 * @param {ProcessedOptions} Options
 * @returns {FileLibraryApi}
 */
module.exports = function( Library, Options ) {

	return /** @lends FileLibraryApi */ {
		/** @borrows readFile as read */
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

		/** @borrows writeFile as write */
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

		/** @borrows statFile as stat */
		stat: statFile,

		/**
		 * Removes selected file.
		 *
		 * @param {string} filename pathname of file to remove
		 * @returns {Promise} promises successful removal of selected file
		 */
		remove: function( filename ) {
			return new Promise( function( resolve, reject ) {
				File.unlink( Path.resolve( Options.switches.projectDir, filename ), function( err ) {
					if ( err && err.code !== "ENOENT" ) {
						reject( err );
					} else {
						resolve();
					}
				} );
			} );
		},

		/** @borrows createFolder */
		createFolder: createFolder,

		/**
		 * Creates some folder and all parent folders missing.
		 *
		 * @param {string} pathname
		 * @returns {Promise}
		 */
		createFolders: function( pathname ) {
			return _create( Path.resolve( Options.switches.projectDir, pathname ) );

			function _create( pathname ) {
				return statFile( pathname )
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

		/**
		 * Writes file from selected template file processing provided data.
		 *
		 * @note Provided name of template file might be given relative to
		 *       templates folder.
		 *
		 * @param {string} templateName name of template file to use
		 * @param {string} filename name of file to write processed template to
		 * @param {object<string,*>=} data data to use on processing template
		 * @param {boolean=} replaceExisting true to omit writing from template
		 *        if target file exists already
		 * @returns {Promise} promises file written successfully
		 */
		writeTemplate: function( templateName, filename, data, replaceExisting ) {
			if ( !replaceExisting ) {
				return statFile( filename )
					.then( function( stat ) {
						if ( !stat.isFile() ) {
							return _create();
						}
					}, _create );
			}

			return _create();

			function _create() {
				return readFile( Path.resolve( Options.switches.templatesDir, templateName ) )
					.then( function( template ) {
						return writeFile( filename, _.template( template )( data || {} ) );
					} );
			}
		},

		/**
		 * Modifies selected file using callback invoked with content of file to
		 * return modified content to be written back to file.
		 *
		 * @param {string} filename
		 * @param {function(Buffer):(Buffer|Promise<Buffer>)} modifierFn function
		 *        invoked with file's content to return modified version of content
		 * @returns {Promise} promises successful modification of file
		 */
		modify: function( filename, modifierFn ) {
			return readFile( filename )
				.then( function( content ) {
					return modifierFn( content );
				} )
				.then( function( content ) {
					return writeFile( filename, content );
				} );
		},

		/**
		 * Processes one out of two optionally given methods depending on
		 * whether some named file exists as file or not.
		 *
		 * @param {string} filename
		 * @param {function(filename:string, stat:File.Stats):?Promise} matchingFn callback invoked if file exists
		 * @param {function(filename:string, stat:?File.Stats):?Promise} mismatchingFn callback invoked if file does not exist or is not a file
		 * @returns {*}
		 */
		isFile: function( filename, matchingFn, mismatchingFn ) {
			return is( filename, "isFile", matchingFn, mismatchingFn );
		},

		/**
		 * Processes one out of two optionally given methods depending on
		 * whether some named file does not exist as file.
		 *
		 * @param {string} filename
		 * @param {function(filename:string, stat:File.Stats):?Promise} matchingFn callback invoked if file does not exist or is not a file
		 * @param {function(filename:string, stat:?File.Stats):?Promise} mismatchingFn callback invoked if file exists
		 * @returns {*}
		 */
		isNotFile: function( filename, matchingFn, mismatchingFn ) {
			return is( filename, "isFile", mismatchingFn, matchingFn );
		},

		/**
		 * Processes one out of two optionally given methods depending on
		 * whether some named directory exists as directory or not.
		 *
		 * @param {string} filename
		 * @param {function(filename:string, stat:?File.Stats):?Promise} matchingFn callback invoked if directory exists
		 * @param {function(filename:string, stat:File.Stats):?Promise} mismatchingFn callback invoked if directory does not exist or is not a directory
		 * @returns {*}
		 */
		isDirectory: function( filename, matchingFn, mismatchingFn ) {
			return is( filename, "isDirectory", matchingFn, mismatchingFn );
		},

		/**
		 * Processes one out of two optionally given methods depending on
		 * whether some named directory does not exist as directory.
		 *
		 * @param {string} filename
		 * @param {function(filename:string, stat:?File.Stats):?Promise} matchingFn callback invoked if directory does not exist or is not a directory
		 * @param {function(filename:string, stat:File.Stats):?Promise} mismatchingFn callback invoked if directory exists
		 * @returns {*}
		 */
		isNotDirectory: function( filename, matchingFn, mismatchingFn ) {
			return is( filename, "isDirectory", mismatchingFn, matchingFn );
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
	function statFile( filename ) {
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

	/**
	 * Calls one out of two methods depending on outcome of stat'ing some file
	 * and calling tester method on result of stat'ing.
	 *
	 * @param {string} filename filename to be stat'ed
	 * @param {string} testerName method name of stat'ing result to be invoked
	 * @param {function(filename:string,stat:File.Stats)} matchingFn callback invoked when tester method succeeded
	 * @param {function(filename:string,stat:File.Stats)} mismatchingFn callback invoked when tester method failed
	 * @returns {Promise}
	 */
	function is( filename, testerName, matchingFn, mismatchingFn ) {
		return statFile( filename )
			.then( function( stat ) {
				if ( stat[testerName]() ) {
					return typeof matchingFn === "function" ? matchingFn( filename, stat ) : true;
				} else {
					return typeof mismatchingFn === "function" ? mismatchingFn( filename, stat ) : false;
				}
			}, function() {
				return typeof mismatchingFn === "function" ? mismatchingFn( filename, null ) : false;
			} );
	}
};
