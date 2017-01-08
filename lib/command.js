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

const Os = require( "os" );
const Path = require( "path" );
const Child = require( "child_process" );

const Glob = require( "glob" );
const _ = require( "lodash" );

module.exports = function( Library, Options ) {
	return {
		invoke: function( name, args, env ) {
			if ( typeof args === "string" )
				args = args.split( /\s+/ );

			if ( /\s/.test( name ) ) {
				name = name.split( /\s+/ );
				args = name.slice( 1 ).concat( args || [] );
				name = name[0];
			}

			return qualifyName( name )
				.then( function( name ) {
					return new Promise( function( resolve, reject ) {
						Child.execFile( name, args, {
							env: _.extend( {}, env )
						}, function( error, stdout, stderr ) {
							let collected = {
								stdout: stdout,
								stderr: String( stderr )
							};

							if ( error ) {
								reject( _.extend( error, collected ) );
							} else {
								resolve( collected );
							}
						} );
					} );
				} );
		}
	};


	function qualifyName( name ) {
		name = name.trim();

		if ( name[0] !== "?" ) {
			return Promise.resolve( name );
		}

		name = name.slice( 1 );


		// qualify pathname
		let pathes = process.env.PATH.split( Path.delimiter );
		pathes.unshift( Path.resolve( Options.switches.projectDir, "node_modules/.bin" ) );
		pathes.unshift( Options.switches.projectDir );

		let suffix = "";
		if ( !name.match( /\.(?:cmd|bat|exe|sh)$/ ) ) {
			suffix = ( Os.platform() == "win32" ) ? "{.cmd,.bat,.exe,.sh}" : "?(.cmd|.bat|.exe|.sh)";
		}


		return new Promise( function( resolve, reject ) {
			testPath( pathes, name );

			function testPath( pathes, name ) {
				let path = pathes.shift();
				if ( !path ) {
					let error = new Error( "no such command: " + name );
					error.code = "ENOENT";
					return reject( error );
				}


				Glob( name + suffix, {
					cwd: path,
					nodir: true
				}, function( err, found ) {
					if ( found.length > 0 ) {
						resolve( Path.resolve( path, found[0] ) );
					} else {
						testPath( pathes, name );
					}
				} );
			}
		} );
	}
};

