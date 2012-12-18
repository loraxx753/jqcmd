(function( $ ){
	/**
	 * Command line prompt plugin. Emulates simple linux style command line prompt
	 */
	$.fn.jqcmd = function( custom ) {
		var objectToString = function(o){
		    
		    var parse = function(_o){
		    
		        var a = [], t;
		        
		        for(var p in _o){
		        
		            if(_o.hasOwnProperty(p)){
		            
		                t = _o[p];
		                if(t && typeof t == "object"){
		                    a[a.length]= '"'+p+'"' + ":{" + arguments.callee(t).join(", ") + "}";
		                }
		                else {
		                    if(typeof t == "string"){
		                        a[a.length] = [ '"'+p+'"'+ ":\"" + t.toString() + "\"" ];                 
		                    }
		                    else{
		                        a[a.length] = [ '"'+p+'"'+ ":" + t.toString()];
		                    }		                    
		                }
		            }
		        }
		        return a;		        
		    }
		    return "{" + parse(o).join(", ") + "}";
		}
		var key = {
			backspace : 8,
			colon : 58,
			delete : 46,
			enter : 13,
			escape : 27,
			left_arrow : 37,
			right_arrow : 39,
			tab : 9,
			up_arrow : 38,
			down_arrow : 40,
			carat : 94,
		}
		var pointer = '';
		var replaceText = function(beforeTxt, selectedTxt, afterTxt) {
			if(!selectedTxt)
			{
				selectedTxt = '';
			}
			if(!afterTxt)
			{
				afterTxt = '';
			}
			$(pointer).parent().html('<span class="before">'+beforeTxt+'</span><span class="selected">'+selectedTxt+'</span><span class="after">'+afterTxt+'</span>');
		}
		var escapeQuotes = function(txt)
		{
			return txt.replace(/("|')/gi, "\\$1");
		}
		var scrapQuotes = function(txt)
		{
			return 	txt.replace(/\\("|')/gi, "$1");
		}
		$this = $(this);
		var cmd = {
			tabCount : 0,
			directory : new Array(),
			history : {
				// Keeps track of where the user is in the file tree  
				load : function() {
					if(typeof(Storage)!=="undefined")
					{
						if(!localStorage.history)
						{
							localStorage.history = "[]";
						}
						cmd.history.stack = $.parseJSON(localStorage.history);
					}
					else
					{
						// Array to keep the history of the user
						cmd.history.stack = new Array();			
					}
				},
				stack : new Array(),
				// Where the pointer is for the history
				pointer : -1,
			},
		}
		// the default line to clone for new lines
		var line;
		// globalizing the element that's been called
		var element = this;

		// Customizable things.
		var settings = $.extend( {
			// The file system json object to act as the file tree
			"fileSystem" : {},
			// What the host name should say before the > tick
			"hostname" : "",
			// What style to use. Black or white are the only one's available (for now)
			"style" : "black",
			"loadScreen" : "",
		}, custom);
		
		if(typeof(Storage)!=="undefined")
		{
			if(!localStorage.fileSystem)
			{
				localStorage.fileSystem = objectToString(settings.fileSystem);
			}
			else
			{
				var test = "return "+localStorage.fileSystem;
				settings.fileSystem = (new Function(test))();
			}
		}

		/**
		 * Runs the command line task that was typed in
		 * @param  {string} call The string of the command
		 * @return {text}        Result text to be sent to the user.
		 */
		var run = function(call) {
			call = $.trim(call);
			cmd.history.stack.push(call);
			if(typeof(localStorage)!=="undefined")
			{
				localStorage.history = JSON.stringify(cmd.history.stack);
			}

			if(call.match(/^[\S]*\.[a-z]+$/))
			{
				var current = getCurrentDirectory();
				if(current._files[call].hasOwnProperty("location"))
				{
					  window.open(current._files[call].location, '_blank');
					  window.focus();
				}
				else if(call.match(/\.exe$/))
				{
					try {
						return current._files[call].execute();
					}
					catch(err)
					{
						return err.message;
					}
				}
			}
			else
			{
				params = getParts(call);
				command = params.command;
				try
				{
					for(i in params.longform)
					{
						functions[command].options[params.longform[i]] = 1;
					}
					for(i in params.shortform)
					{
						functions[command].options[functions[command].shortcodes[params.shortform[i]]] = 1;
					}
					var result = functions[command].execute(params);
					for(i in functions[command].options)
					{
						functions[command].options[i] = 0;
					}
					return result;
				}
				catch(err)
				{
					parts = call.split(" ");
					console.log(err.message);
					return "-bash: "+command+": command not found";
				}

			}
		}
		/**
		 * Parses the command string to get the command and parameters
		 * @param  {string} str the input string
		 * @return {object}     An object of parameters
		 */
		var getParts = function(str)
		{
			params = {};
			parts = str.split(" ");
			
			found = str.match(/\-\-([a-z]+)/gi);
			
			params.longform = new Array();
			for(i in found)
			{
				params.longform.push(found[i].substr(2));
			}

			str = str.replace(/[\s]*\-\-[a-z]+[\s]*/gi, "");

			var found = str.match(/\-([a-z]+)/gi);
			params.shortform = new Array();
			for(i in found)
			{
				found[i] = found[i].slice(1);
				var split = found[i].split("");
				params.shortform = params.shortform.concat(split);
			}


			str = str.replace(/[\s]*\-[a-z]+[\s]*/gi, "");

			sections = str.split(" ");

			params.command = sections.shift();

			if(sections.length > 0)
			{
				params.target = sections.pop();
			}
			// console.log(params);
			return params;
		}
		/**
		 * Tab autocomplete functinolity
		 * @param  {selector} Selector to fild
		 * @return {void}     
		 */
		var complete = function(input) {
			var splitup = input.split(' ');
			if(splitup.length == 0)
			{
				splitup = new Array(input);
			}
			var directories = splitup.pop();

			var directoryTest = directories.split("/");
			if(directoryTest.length == 0)
			{
				var search = directories;
			}
			else
			{
				directories = directories.split("/");
				var search = directories.pop();
			}
			var current = parseFolderText(directories);


			var items = new Array();
			var found = new Array();

			for(i in current._folders)
			{
				items.push(i+"/");
			}
			if(current._files && splitup[0] != "cd")
			{
				for(i in current._files)
				{
					items.push(i);
				}
			}
			for(i in items)
			{
				var patt = new RegExp("^"+search, "i");
				if(items[i].match(patt))
				{
					found.push(items[i]);
				}
			}

			if(found.length == 1)
			{
				if(directories.length > 0)
				{
					var returnText = splitup.join(" ")+" "+directories.join("/")+"/"+found[0];
				}
				else
				{
					var returnText = splitup.join(" ")+" "+found[0];
				}

				replaceText(returnText);
			}
			else if(found.length > 1)
			{
				if(cmd.tabCount == 0)
				{
					cmd.tabCount++;
					return;
				}
				var returnText = '';
				for(i in found)
				{
					returnText += "<p class='ls_list'>"+found[i]+"</p>"
				}
				newLine = $(pointer).parent().parent().clone();
				$(pointer).parent().after("<div class='output'>"+returnText+"</div>");
				$(pointer).parent().html($(pointer).parent().text());
				$('.output:last-child').after(newLine);
			}
		}

		var fileTreeUpdate = function() {
			if(typeof(Storage)!=="undefined")
			{
				localStorage.fileSystem = objectToString(settings.fileSystem);
			}
		}
		/**
		 * List of functions that can be used by the system
		 * @type {Object}
		 */
		var functions = {
			clear : {
				execute : function (options) {
					$(".jqcmd_window").empty().html(line.clone());
					return "clearConsole";
				},
				help : "clears the screen of all text"
			},

			ls : {
				options : {
					"all" : 0,
					"almost-all" : 0,
					"author" : 0,
					"escape" : 0,
					"blocksize" : 0, //options
					"ignore-backups" : 0,
					"color" : 0, //optional options
					"long" : 0,
					"directory" : 0,
					"dired" : 0,
					"classify" : 0,
					"file-type" : 0,
					"format" : 0, //options
					"full-time" : 0,
					"group-directories-first" : 0,
					"no-group" : 0,
					"human-readable" : 0,
					"si" : 0,
					"dereference-command-line" : 0,
					"dereference-command-line-symlink-to-dir" : 0,
					"hide" : 0, //options
					"indicator-style" : 0,
					"inode" : 0,
					"ignore" : 0, //options
					"dereference" : 0,
					"numeric-uid-gid" : 0,
					"literal" : 0,
					"indicator-style" : 0, //options
					"hide-control-chars" : 0,
					"show-control-chars" : 0,
					"quote-name" : 0,
					"quoting-style" : 0, //options
					"reverse" : 0,
					"recursive" : 0,
					"size" : 0,
					"sort" : 0, //options
					"time" : 0, //options
					"time-style" : 0, //options
					"tabsize" : 0, //options
					"width" : 0, //options
					"context" : 0,
					"help" : 0,
					"version" : 0, //options

				},
				shortcodes : {
					"a" : "all",
					"l" : "long",
					"A" : "almost-all",
				},
				execute : function(params) {
					var options = functions.ls.options;
					// console.log(options);
					var output = "<ul>";
					var current = getCurrentDirectory();
					for(i in current._folders)
					{
						output += "<li>"+i+"/</li>";
					}
					for(i in current._files)
					{
						if(i.substring(0,1) != "." || options['all'])
						{
							output += "<li>"+i+"</li>";
						}
					}
					output += "</ul>";
					return output;
				},
				help : "lists all files and folders for your current directory"
			},
			help : {
				execute : function() {
					returnString = "Here's a list of commands to use for this site: <ul>";
					for(i in functions)
					{
						returnString += "<li><span class='padleft'>"+i+ "</span> : "+functions[i].help+"</li>";
					}
					returnString += "</ul>";
					return returnString;
				},
				help : "displays help for the system"
			},
			cat : {
				execute : function(params) {
					current = getCurrentDirectory();
					if(params.target.match(/\.exe$/))
					{
						return current._files[params.target].execute.toString();
					}
					else
					{
						return current._files[params.target].contents;						
					}
				},
				help : "Print file contents to the screen",
			},
			cd : {
				execute : function(params) {
					if(params.target != "/")
					{
						if(params.target.charAt( params.target.length-1 ) == "/")
						{
							params.target = params.target.slice(0, -1);
						}
						var dirs = params.target.split("/");
						var childDir = params.target;
						var current = getCurrentDirectory();
						try {
							var tempCurrent = parseFolderText(dirs, true);
						}
						catch(err)
						{
							return err;
						}

					}
					else
					{
						cmd.directory = new Array();
					}
				},
				help : "Changes the current directory the user is in"
			},
			mkdir : {
				execute : function(params) {
					current = getCurrentDirectory();
					current._folders[params.target] = {};
					fileTreeUpdate();
				},
				help : "Makes a directory in the file tree"
			},
			touch : {
				execute : function(params) {
					current = getCurrentDirectory();
					if(!current._files)
					{
						current._files = {};
					}
					current._files[params.target] = {};
					fileTreeUpdate();
				},
				help : "Creates a file, or if the file exists, updates the files timestamp",
			},
			rm : {
				execute : function(params) {
					current = getCurrentDirectory();
					delete current._files[params.target]
					fileTreeUpdate();
				},
				help : "Removes a file from the file tree",
			},
			vi : {
				execute : function(params) {
					var fileText;
					var newFile;
					var parts = params.target.split("/");
					var filename = parts.pop();
					current = parseFolderText(parts);
					if(current._files[filename])
					{
						fileText = current._files[filename].contents;
					}
					else
					{
						fileText = "";
					}
					$(".jqcmd_window").off("keydown.mainKeyDown");
					$(".jqcmd_window").off("keypress.mainKeyPress");
					$(".jqcmd_window").hide().after("<div id='viScreen' tabindex=8></div>");
					$("#viScreen").jqvi({
						"fileText" : fileText,
						"filesystem" : current,
						"filename" : filename,
						unloadCallback : function() {
							$("#viScreen").remove();
							$(".jqcmd_window").show();

							fileTreeUpdate();
							$('.cmd_current_line').removeClass("cmd_current_line");
							// Replaces the text of the input 
							$(pointer).parent().parent().html($(pointer).parent().parent().text()).after(line.clone().addClass("cmd_current_line"));
							$(".jqcmd_window").focus();
							$(".jqcmd_window").on("keydown.mainKeyDown", mainKeyDown);
							$(".jqcmd_window").on("keypress.mainKeyPress", mainKeyPress);
						},
					});
				},
				help : "A simple text editor for the command line",
			},
		}

		var navigation = function(e, deleteOption, callback)
		{
			$pointer = $(pointer)
			if(!deleteOption){
				deleteOption = false;
			}
			if(deleteOption == true)
			{
				if(e.which == key.delete) //delete key
				{
					var input = $pointer.parent().children(".after").text();
					var slicedString = input.slice(1);
					var firstLetter = input.slice(0, 1);
					$pointer.parent().children(".selected").text(firstLetter);
					$pointer.parent().children(".after").text(slicedString);
				}
				else if(e.which == key.backspace) //backspace
				{
					e.preventDefault();
					var string = $pointer.parent().children(".before").text().slice(0, -1);
					$pointer.parent().children(".before").text(string);
				}
			}
			else
			{
				if(e.which == 8)
				{
					e.preventDefault();
				}
			}
			if(e.which == key.left_arrow) //left arrow
			{
				var input = $pointer.parent().children(".before").text();
				if(input.length > 0)
				{
					var slicedString = input.slice(0, -1);
					var lastLetter = input.slice(-1);
					$pointer.parent().children(".after").text($pointer.parent().children(".selected").text()+$pointer.parent().children(".after").text());
					$pointer.parent().children(".selected").text(lastLetter);
					$pointer.parent().children(".before").text(slicedString);						
				}
			}
			else if(e.which == key.right_arrow) //right arrow
			{
				var input = $pointer.parent().children(".after").text();
				var slicedString = input.slice(1);
				var firstLetter = input.slice(0, 1);
				$pointer.parent().children(".before").text($pointer.parent().children(".before").text()+$pointer.parent().children(".selected").text());
				$pointer.parent().children(".selected").text(firstLetter);
				$pointer.parent().children(".after").text(slicedString);
			}

			if(callback)
			{
				callback();
			}	
		}

		var parseFolderText = function(pathParts, overWriteDirectory)
		{
			var tempDirectories = cmd.directory.slice(0);
			var tempCurrent = settings.fileSystem;

			for(i in pathParts)
			{
				if(pathParts[i] == "..")
				{
					tempDirectories.pop();
				}
				else
				{
					tempDirectories.push(pathParts[i]);
				}
			}

			for(i in tempDirectories)
			{
				if(tempCurrent._folders[tempDirectories[i]] != undefined)
				{
					tempCurrent = tempCurrent._folders[tempDirectories[i]];
				}
				else
				{
					throw "not found";
					return;
				}
			}
			console.log("below");
			if(overWriteDirectory)
			{
				cmd.directory = tempDirectories;	
			}

			return tempCurrent;

		}
		/**
		 * Gets the current directory in the file tree and returns that part of the object
		 * @return {object} 
		 */
		var getCurrentDirectory = function()
		{
			var current = settings.fileSystem;
			for(i in cmd.directory)
			{
				current = current._folders[cmd.directory[i]];
			}
			return current;
		}



		var mainKeyDown = function(e) {
			$pointer = $(pointer);
			if(e.which == key.tab) //tab
			{
				e.preventDefault();
				complete($pointer.parent().text());
			}
			else if(e.which == key.up_arrow ) //up arrow
			{
				e.preventDefault();

				if(cmd.history.pointer < 0)
				{
					cmd.history.pointer = cmd.history.stack.length-1;
				}
				else if(cmd.history.pointer > 0)
				{
					cmd.history.pointer--;
				}
				if(cmd.history.pointer >= 0)
				{
					$pointer.parent().text(replaceText(cmd.history.stack[cmd.history.pointer]));
				}
			}
			else if(e.which == key.down_arrow) //down arrow
			{
				e.preventDefault();
				if(cmd.history.pointer > cmd.history.stack.length-1)
				{
					cmd.history.pointer = cmd.history.stack.length-1;
				}
				else if(cmd.history.pointer != cmd.history.stack.length-1)
				{
					cmd.history.pointer++;
				}
				if(cmd.history.pointer <= cmd.history.stack.length-1)
				{
					$(pointer).parent().text(replaceText(cmd.history.stack[cmd.history.pointer]));
				}
			}
			else
			{
				navigation(e, true);
			}
		}

		var mainKeyPress = function(e) {
			$pointer = $(pointer);
			var keycode = null;
			if(window.event) {
				keycode = window.event.keyCode;
			}else if(e) {
				keycode = e.which;
			}
			if(cmd.tabCount > 0)
			{
				cmd.tabCount = 0;
			}
			// If the key isn't "enter" and the control key isn't pressed, then append the pressed key to the screen
			if(keycode != key.enter && e.ctrlKey == false)
			{
				var keyTxt = String.fromCharCode(keycode);
				$pointer.parent().children(".before").append(keyTxt);
			}
			else
			{
				cmd.history.pointer = -1;
				// Run the function and get the input
				var output = run($(pointer).parent().text());
				//clone a new line
				newLine = line.clone().addClass("cmd_current_line");
				// if the output doesn't clear the console
				if(output != "clearConsole")
				{
					// Append the current filetree location to the hostname
					var staticText = $(newLine).children(".static").text();
					for(i in cmd.directory)
					{
						if(cmd.directory[i] != "root")
						{
							staticText += "/"+cmd.directory[i];
						}
						$(newLine).children(".static").text(staticText);
					}
					// If there is output then print it to the screen.	
					if(output != undefined)
					{
						$parent = $(pointer).parent().parent().removeClass("cmd_current_line");
						$(pointer).remove();
						$parent.after("<div class='output'>"+output+"</div>");
						$('.output:last-child').after(newLine);					
					}
					else
					{
						$parent = $(".jqcmd_window").find(pointer).parent();
						$(".jqcmd_window").find(pointer).remove();
						$parent.after(newLine);
					}
				}
			}
			// Keep the scrollbar at the bottom of the screen.
			$this.animate({ scrollTop: $this[0].scrollHeight }, "fast");
		}

		// This is where the real meat of everything is....
		return this.each(function() {
			// Add the jqcmd class and the style class
			$this.addClass("jqcmd").addClass(settings.style);
			$this.css("position", "relative");
			// Append the first line to the div
			$this.prepend('<div class="jqcmd_menu"><ul><li><a href=#">Export</a></li></ul></div>');
			$this.append('<div class="jqcmd_window" tabindex=2>'+settings.loadScreen+'<p id="first"><span class="static">'+settings.hostname+'</span> > <span class="input"><span class="before"></span><span class="selected"></span><span class="after"></span></span></p></div>');
			var position = $this.offset();
			// Clone the first line to use for later
			line = $this.find('#first').clone().removeAttr("id");
			$this.find('#first').addClass("cmd_current_line");
			$this.children('.jqcmd_menu').click(function(e) {
				e.preventDefault();
				var preparedString = objectToString(settings.fileSystem);
				preparedString = preparedString.replace(/</g, "&lt;");
				var other = window.open("", '_blank');
				window.focus();
				other.document.write(preparedString);
			});
			$(".jqcmd_window").on("keydown.mainKeyDown", mainKeyDown);
			$(".jqcmd_window").on("keypress.mainKeyPress", mainKeyPress);
			$(".jqcmd_window").focus();
			pointer = ".selected:visible";
			cmd.history.load();
		});
	};
})( jQuery );