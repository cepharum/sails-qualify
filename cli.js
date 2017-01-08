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

const Vorpal = require( "vorpal" )();


// process invocation arguments
const Options = parseOptions( Vorpal.parse( process.argv, { use: "minimist" } ), {
	projectDir: __dirname
} );


// load all library modules
const Lib = Object.seal( require( "./lib" )( Options ) );


// load all local modules
let modulesDir = Path.resolve( __dirname, "modules" );
File.readdir( modulesDir, function( err, names ) {
	if ( err ) {
		console.error( "failed loading modules" );
		return;
	}

	names.forEach( function( name ) {
		if ( name[0] !== '.' ) {
			require( Path.resolve( modulesDir, name ) )( Vorpal, Lib );
		}
	} );


	// integrate fallback handler to try invoking extension on using unknown cmd
	Vorpal
		.catch( "[words...]", "Integrates custom extensions into sails-qualifier." )
		.action( function( args ) {
			let words   = args.words,
			    command = words.shift();

			try {
				return require( "sails-qualifier-" + command )( Vorpal, Lib, Lib.utility.qualifyArguments( args ) );
			} catch ( e ) {
				console.error( "no such command or extension: " + command );
				cb();
			}
		} );


	// show CLI for entering several commands to run
	Vorpal
		.delimiter( "sails-qualify>" )
		.history( "sails-qualify" );

	if ( Options.command ) {
		Vorpal.exec( Options.command );
	} else {
		Vorpal.show();
	}
} );

/**
 * @typedef {object<string,(string|boolean|number)>} KVOptionSet
 */

/**
 * Parses provided options parsed using `minimist`.
 *
 * The resulting set separates all switches into supported and unsupported ones
 * of sails-qualify as a tool. In addition it recompiles command line to be
 * implicitly invoked on internal prompt.
 *
 * @param {KVOptionSet} input
 * @param {KVOptionSet} defaults
 * @returns {{switches: KVOptionSet, unprocessed: KVOptionSet, command: string=}}
 */
function parseOptions( input, defaults ) {
	let parsed = {
	    switches: defaults,
	    unprocessed: {},
    };

	let args = [];

	Object.keys( input )
		.forEach( function( name ) {
			switch ( name ) {
				case "project" :
					parsed.switches.projectDir = Path.resolve( __dirname, input[name] );
					break;

				case "_" :
					break;

				default :
					parsed.unprocessed[name] = input[name];

					let cmd;

					if ( name.length > 1 ) {
						cmd = makeArgument( "--", name, "=", input[name] );
					} else {
						cmd = makeArgument( "-", name, " ", input[name] );
					}

					if ( cmd ) {
						args.push( cmd );
					}
			}
		} );

	if ( input._.length ) {
		parsed.command = input._.shift();

		if ( input._.length || args.length ) {
			parsed.command += " " + args.concat( input._.map( ( n ) => stringify( n ) ) ).join( " " );
		}
	}

	return parsed;
}

/**
 * Compiles CLI argument string from provided information.
 *
 * @param {string} prefix prefix indicating use of switch, e.g. "--" or "-"
 * @param {string} name name of option/switch
 * @param {string} operator operator to use for separating option name from value, e.g. "="
 * @param {string} value raw value of option
 * @returns {string} compiled string describing given option/switch for use in a command line
 */
function makeArgument( prefix, name, operator, value ) {
	value = stringify( value );

	if ( value === true ) {
		return prefix + name;
	}

	if ( value === false ) {
		return null;
	}

	return prefix + name + operator + value;
}

/**
 * Wraps provided value in double quotes if required.
 *
 * @param {string} value some value to be optionally quoted
 * @returns {string} optionally quoted value
 */
function stringify( value ) {
	if ( /\s/.test( value ) ) {
		return '"' + value.replace( /"/g, '\"' ) + '"';
	}

	return value;
}
