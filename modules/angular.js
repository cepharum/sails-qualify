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
		.command( "angular", "Prepares for developing client with AngularJS 1.x." )
		.action( angularAction )
		.actionHandler = angularAction;


	function angularAction( args ) {
		let self   = this,
			config = {
				styleMode: undefined,
				templateMode: undefined,
				appName: undefined
			};

		args = Lib.utility.qualifyArguments( args );

		return Vorpal.find( "bower" ).actionHandler.call( self, args )
			.then( function extractConfiguration() {
				return Lib.view.readAttribute( "views/layout", "ng-app" )
					.then( function( foundAppName ) {
						if ( foundAppName !== undefined && foundAppName !== null ) {
							config.appName = String( foundAppName );
						}
					} );
			} )
			.then( function askConfiguration() {
				return self.prompt( {
					type: "string",
					name: "appName",
					message: "Provide name of AngularJS module to describe client app! ",
					default: config.appName || "myapp",
					validate: function( input ) {
						return Boolean( input.trim().match( /^[a-z][_a-z0-9]*$/i ) );
					}
				} )
					.then( function( responses ) {
						config.appName = responses.appName.trim();
					} );
			} )
			.then( function detectConfiguration() {
				return Lib.file.read( "tasks/register/compileAssets.js" )
					.then( function( code ) {
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

						config.templateMode = match[2];
					} );
			} )
			.then( function assureInjectionMarks() {
				// ensure to have injection markers in importer stylesheet file
				return Lib.file.modify( "assets/styles/importer." + config.styleMode, function( content ) {
					content = content.toString();

					if ( !content.match( /\r?\n\s*\/\/[ \t]*COMPONENT[ \t]+STYLES\b[\s\S]*?\r?\n\s*\/\/[ \t]*COMPONENT[ \t]+STYLES[ \t]+END\b/ ) ) {
						content += "\n// COMPONENT STYLES\n// COMPONENT STYLES END\n";
					}

					return content;
				} );
			} )
			.then( function adjustPipeline() {
				return Lib.file.modify( "tasks/pipeline.js", function( content ) {
					content = String( content );

					let templateExt = config.templateMode === "jst" ? "html" : config.templateMode;

					// update list of patterns for choosing JS files to inject
					content = content.replace( /(\r?\n\s*?(?:var|let)?\s*\bjsFilesToInject\b[^[]+?\[\s*)([^\]]+?)(\s*\])/g, function( all, pre, list, post ) {

						list = list.replace( /(\r?\n\s*)(['"])(js\/dependencies\/\*\*\/\*\.js)\2/g, function( all, indent, quote, glob ) {
							return indent + quote + "js/dependencies/angular/angular.min.js" + quote + "," +
							       indent + quote + "js/dependencies/**/*.min.js" + quote;
						} );

						list = list.replace( /(\r?\n\s*)(['"])(js\/\*\*.+?\.js)\2/g, function( all, indent, quote, glob ) {
							return indent + quote + "components/*.js" + quote + "," +
							       indent + quote + "components/**/*.js" + quote;
						} );

						return pre + list + post;
					} );

					// update list of patterns for choosing templates to inject
					content = content.replace( /(\r?\n\s*?(?:var|let)?\s*\btemplateFilesToInject\b[^[]+?\[\s*)([^\]]+?)(\s*\])/g, function( all, pre, list, post ) {

						list = list.replace( /(\r?\n[ \t]*)(['"])((?:templates|components)\/\*\*\/\*\.(?:html|pug|jade))\2/g, function( all, indent, quote, glob ) {
							return indent + quote + "components/**/*." + templateExt + quote;
						} );

						return pre + list + post;
					} );

					return content;
				} );
			} )
			.then( function adjustCompileTask() {
				return Lib.file.modify( "tasks/register/compileAssets.js", function( content ) {
					content = String( content );

					if ( !content.match( /(["'])(?:s[ac]ss|less)-angular:.+?\1/ ) ) {
						content = content.replace( /(\r?\n[ \t]*)(["'])(s[ac]ss|less)(:.+?)\2/, function( all, indent, quote, type, mode ) {
							return indent + quote + config.styleMode + "-angular" + mode + quote + "," +
						           indent + quote + type + mode + quote;
						} );
					}

					return content;
				} );
			} )
			.then( function adjustSyncTask() {
				return Lib.file.modify( "tasks/register/syncAssets.js", function( content ) {
					content = String( content );

					if ( !content.match( /(["'])(?:s[ac]ss|less)-angular:.+?\1/ ) ) {
						content = content.replace( /(\r?\n[ \t]*)(["'])(s[ac]ss|less)(:.+?)\2/, function( all, indent, quote, type, mode ) {
							return indent + quote + config.styleMode + "-angular" + mode + quote + "," +
						           indent + quote + type + mode + quote;
						} );
					}

					return content;
				} );
			} )
			.then( function writeAppName() {
				let adjusted = false;

				return Lib.view.processAttribute( "views/layout", "ng-app", changer )
					.then( function() {
						if ( !adjusted ) {
							return Lib.view.processAttribute( "views/layout", "ng-app", adder );
						}
					} );

				function changer( element, value ) {
					adjusted = true;
					return config.appName || value;
				}

				function adder( element ) {
					if ( element.toLowerCase() === "html" ) {
						return config.appName;
					}
				}
			} )
			.then( () => this.log( "Enabled AngularJS 1.x based client." ) );
	}
};
