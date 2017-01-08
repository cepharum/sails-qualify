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

const Argv = require( "minimist" )( process.argv.slice( 2 ) );
const Vorpal = require( "vorpal" )();

const Options = parseOptions( Argv, {
	projectDir: __dirname
} );
const Mode = Argv._.shift();
const Args = Argv._;


let modulesDir = Path.resolve( __dirname, "modules" );

File.readdir( modulesDir, function( err, names ) {
	if ( err ) {
		console.error( "failed loading modules" );
		return;
	}

	names.forEach( function( name ) {
		if ( name[0] !== '.' ) {
			require( Path.resolve( modulesDir, name ) )( Vorpal, Options, Args );
		}
	} );

	Vorpal
		.catch( "[words...]", "Integrates extensions to sails-qualifier." )
		.action( function( args, cb ) {
			let words   = args.words,
				command = words.shift();

			try {
				return require( "sails-qualifier-" + command )( Options, Args.concat( words ), cb, require( "./lib" ) );
			} catch ( e ) {
				console.error( "no such command or extension: " + command );
				cb();
			}
		} );

	if ( Mode ) {
		Vorpal.exec( Mode )
			.catch( function( cause ) {
				console.error( String( cause.message || cause || "unknown error" ) );
			} );
	} else {
		Vorpal
			.delimiter( "sails-qualify>" )
			.history( "sails-qualify" )
			.show();
	}
} );


function parseOptions( input, defaults ) {
	if ( input.projectDir ) {
		defaults.projectDir = input.projectDir;
	}

	return defaults;
}
