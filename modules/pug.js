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

module.exports = function( Vorpal, Lib ) {

	Vorpal
		.command( "pug", "Switches to pug for view description." )
		.option( "--pushy", "Remove files not in use anymore after adjusting." )
		.option( "--compatible", "Call it 'jade' instead of 'pug'." )
		.action( function( args ) {
			let self = this;

			args = Lib.utility.qualifyArguments( args );

			let name = args.options.compatible ? "jade" : "pug";

			return Lib.validator.isSailsProject( true )
				.then( function() {
					return Lib.meta.installDependency( ["grunt-contrib-" + name, name] );
				} )
				.then( function() {
					return Lib.file.writeTemplate( "pug/pug.js", "tasks/config/" + name + ".js", { mode: name } );
				} )
				.then( function() {
					return Lib.file.modify( "config/views.js", adjustConfiguration.bind( undefined, name ) );
				} )
				.then( function() {
					return Lib.file.modify( "tasks/pipeline.js", adjustPipeline.bind( undefined, name ) );
				} )
				.then( function() {
					return Lib.file.modify( "tasks/register/compileAssets.js", adjustAssetTask.bind( undefined, name ) );
				} )
				.then( function() {
					return Lib.file.modify( "tasks/register/syncAssets.js", adjustAssetTask.bind( undefined, name ) );
				} )
				.then( function() {
					return Lib.file.modify( "tasks/register/syncAssets.js", adjustAssetTask.bind( undefined, name ) );
				} )
				.then( function() {
					return Promise.all( [
						Lib.file.writeTemplate( "pug/views/403.pug", "views/403." + name ),
						Lib.file.writeTemplate( "pug/views/404.pug", "views/404." + name ),
						Lib.file.writeTemplate( "pug/views/500.pug", "views/500." + name ),
						Lib.file.writeTemplate( "pug/views/homepage.pug", "views/homepage." + name ),
						Lib.file.writeTemplate( "pug/views/layout.pug", "views/layout." + name ),
					] );
				} )
				.then( function() {
					if ( args.options.pushy ) {
						return self.prompt( {
							type: "confirm",
							name: "remove",
							default: false,
							message: "Genuine view files can't be restored w/o git. Really remove now?"
						} )
							.then( function( answers ) {
								if ( answers.remove ) {
									return Promise.all( [
										Lib.file.remove( "views/403.ejs" ),
										Lib.file.remove( "views/404.ejs" ),
										Lib.file.remove( "views/500.ejs" ),
										Lib.file.remove( "views/homepage.ejs" ),
										Lib.file.remove( "views/layout.ejs" ),
									] );
								}
							} );
					}
				} )
				.then( () => this.log( "Switched to pug.") );
		} );


	function adjustConfiguration( actualName, code ) {
		code = code.toString();

		code = code.replace( /^(\s*(?:engine|"engine"|'engine')\s*:\s*)(["']).+?\2/mg, function( all, pre, quote ) {
			return pre + quote + actualName + quote;
		} );

		return Buffer.from( code );
	}

	function adjustPipeline( actualName, code ) {
		code = code.toString();

		code = code.replace( /(\btemplateFilesToInject\b[^[]*\[)([^\]]+)(\])/g, function( all, pre, inner, post ) {
			return pre + inner.replace( /\.html(["'])/g, function( all, quote ) {
				 return ".{jade,pug}" + quote;
			} ) + post;
		} );

		return Buffer.from( code );
	}

	function adjustAssetTask( actualName, code ) {
		code = code.toString();

		code = code.replace( /(["'])jst(:.+?)\1/g, function( all, quote, mode ) {
			return quote + actualName + mode + quote;
		} );

		return Buffer.from( code );
	}
};
