/**
 * Script PhantomJS
 * Author: nicolastorre
 * Description: report for list of sites (Array sites) the status, loading time and screenshot
 * Licence: MIT
 * 
 */
 
	'use strict';

	var webpage = require('webpage');

	/**
	 * List of websites to be customized
	 * 
	 */
	var sites = [
	    "http://www.google.com"
	];

	/**
	 * main controller
	 * 
	 */
	var controller = function() {
		this.init();
	};

	controller.prototype = {

		/**
		 * Init the controller
		 *  
		 */
		init: function() {
			console.log('Init script parameters');

			this.pages = [];
			this.outputHTML = "";
			this.index = 0;
			this.start_time_global = Date.now();
			this.outputHTML = "<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>PahntomJS Website Report</title><style>table, tr, th, td { border: 1px solid black; border-collapse: collapse;}</style></head><body><h1>PhantomJS Website Report</h1><table><thead><tr><th>URL du site</th><th>Statut</th><th>Loading time</th><th>Request</th><th>Screenshot</th></tr></thead>";
			
			this.testURL();

		},

		/**
		 * Init the parameters for one website
		 *  
		 */
		initParam: function() {
			this.time_start = Date.now();
			this.error_buffer = [];
			this.ressources_buffer = [];
			this.image_counter = 0;
			this.html_counter = 0;
			this.scripts_counter = 0;
			this.styles_counter = 0;
			this.other_counter = 0;
			this.time_loadStart = 0;
			this.time_loadEnd = 0;
			
		},

		/**
		 * Test a URL (status, loading time, ressources and screenshot)
		 * 
		 */
		testURL: function() {
			var that = this;
			var bgColor;
			var color;
			var msgStatus;
			
			this.initParam();

			if (this.index < sites.length) {
				console.log("URL: "+sites[this.index]);

				this.pages[this.index] = webpage.create();
				this.pages[this.index].viewportSize = {width: 1280, height: 800};
				
				this.pages[this.index].onResourceReceived = function (response) {
					that.onResourceReceived(response);
				};

				this.pages[this.index].onError = function (msg, trace) {
					that.onError(msg, trace);
				};

				this.pages[this.index].onLoadStarted = function() {
					var now = new Date();
					that.time_loadStart = now.getTime();
				};

				this.pages[this.index].onLoadFinished = function(status) {
					var now = new Date();
					that.time_loadEnd = now.getTime();
				};
				
				this.pages[this.index].open(sites[this.index], function (status) {
					
					if ('success' === status && 0 === that.error_buffer.length) {
						bgColor = "#00FF00";
						color = "#000000";
						msgStatus = "SUCCESS";
					} else {
						bgColor = "#FF0000";
						color = "#FFFFFF";
						msgStatus = "FAIL";
					}

					// Add the result of the current test to the ouput
					that.addToOutputHTML(bgColor, color, msgStatus);
					
					// Call testURL for the next URL
					that.index = that.index + 1;
					that.testURL();
				});

			} else {
				
				// End of the analysis
				this.exportOutputPDF();
			}
		},
		
		/**
		 * Generate  the pdf report
		 * 
		 */
		exportOutputPDF: function() {

			this.outputHTML += "</table></body></html>";

			var output = webpage.create();
            output.paperSize = {format: 'A4', orientation: 'portrait', margin: '1cm' };
            output.setContent(this.outputHTML,"");

            console.log("Analysis done ...");
            
            setTimeout(function () {
                output.render('WebsiteReport.pdf', {format: 'pdf', quality: '100'});
                console.log('Report generated automatically in ' + (Date.now() - this.start_time_global) + ' ms for ' + sites.length + ' sites (with PhantomJS version ' + phantom.version.major + '.' + phantom.version.minor + '.' + phantom.version.patch +')');
                phantom.exit();
            }, 5000);
		},
		
		/**
		 * Add the result of a test to the main output
		 * 
		 */
		addToOutputHTML: function(bgColor, color, msgStatus) {

		        var img = this.pages[this.index].renderBase64('PNG');

				this.outputHTML += '<tr>'+
				'<td style="background-color: '+bgColor+'; color: '+color+';">'+msgStatus+'</td>'+
				'<td><a href="' + sites[this.index] + '" target="_blank">' + sites[this.index] + '</a></td>'+
                '<td>' + (this.time_loadEnd - this.time_loadStart) + ' ms</td>'+
		        '<td>Images : ' + this.image_counter + '<br>Scripts : ' + this.scripts_counter + '<br>Styles : ' + this.styles_counter + '<br>HTML : ' + this.html_counter + '<br>Autres : ' + this.other_counter+'</td>'+
		        '<td><img width="200" src="data:image/png;base64,' + img + '"></td>'+
		        '</tr>';
		        
		},

		/**
		 * Increments the number of received resources by type
		 * 
		 */
		onResourceReceived: function(response) {
			switch (response.contentType) {
				case 'image/png':
				case 'image/jpeg':
				case 'image/gif':
				    this.image_counter = this.image_counter + 1;
				    break;
				case 'text/html; charset=UTF-8':
				    this.html_counter = this.html_counter + 1;
				    break;
				case 'text/css':
				    this.styles_counter = this.styles_counter + 1;
				    break;
				case 'text/javascript':
				case 'text/javascript; charset=UTF-8':
				case 'application/x-javascript':
				case 'application/javascript':
				case 'application/javascript; charset=utf-8':

				    this.scripts_counter = this.scripts_counter + 1;
				    break;
				default:
				    this.ressources_buffer.push('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response));
				    this.other_counter = this.scripts_counter + 1;
				    break;
			}
		},

		/**
		 *  Invoked when there is a JavaScript execution error in the web page context
		 *  
		 */
		onError: function(msg, trace) {
			this.error_buffer = [msg];
			if (trace) {
				trace.forEach(function (t) {
					this.error_buffer.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
				});
			}	
		}

	};
	
	// Start the controller
	var phantomJSTest = new controller();

