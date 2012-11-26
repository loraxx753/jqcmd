(function( $ ){
	/**
	 * Command line prompt plugin. Emulates simple linux style command line prompt
	 */
	$.fn.jqcmd = function( custom ) {
		// Keeps track of where the user is in the file tree  
		var directory = new Array();
		if(typeof(Storage)!=="undefined")
		{
			if(!localStorage.history)
			{
				localStorage.history = "[]";
			}
			var history = $.parseJSON(localStorage.history);
		}
		else
		{
			// Array to keep the history of the user
			var history = new Array();			
		}
		// Where the pointer is for the history
		var pointer = -1;
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

		/**
		 * Runs the command line task that was typed in
		 * @param  {string} call The string of the command
		 * @return {text}        Result text to be sent to the user.
		 */
		var run = function(call) {
			call = $.trim(call);
			history.push(call);
			if(typeof(Storage)!=="undefined")
			{
				localStorage.history = JSON.stringify(history);
			}

			if(call.match(/^[\S]*\.[a-z]+$/))
			{
				var current = getCurrentDirectory();
				if(current._files[call].hasOwnProperty("location"))
				{
					  window.open(current._files[call].location, '_blank');
					  window.focus();
				}
				else
				{
					return current._files[call].execute();
				}
			}
			else
			{
				params = getParts(call);
				command = params.command;
				// try
				// {
					return functions[command].execute(params);
				// }
				// catch(err)
				// {
				// 	console.log(err);
				// 	parts = call.split(" ");
				// 	return "That function does not exist. For help and a list of functions, type \"help\"";
				// }

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

			return params;

		}
		/**
		 * Tab autocomplete functinolity
		 * @param  {selector} Selector to fild
		 * @return {void}     
		 */
		var complete = function(input) {
			var splitup = $(input).text().split(' ');
			if(splitup.length == 0)
			{
				splitup = new Array($(input).text());
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
			var current = getCurrentDirectory();

			for(i in directories)
			{
				current = current[directories[i]];
			}
			var items = new Array();
			var found = new Array();

			for(i in current)
			{
				items.push(i);
			}
			if(current._files)
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

				if(current[found[0]])
				{
					returnText += "/";
				}

				$(input).text(returnText);
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
				execute : function(params) {
					var output = "<ul>";
					var current = getCurrentDirectory();
					if(current.location != null) 
					{
						for(i in current)
						{
							if(i != "_files")
							{
								output += "<li>"+current[i]+"</li>";
							}
						}
					}
					else
					{
						for(i in current)
						{
							if(i != "_files")
							{
								output += "<li>"+i+"/</li>";
							}
						}
						if(current._files)
						{
							for(i in current._files)
							{
								if(i.substring(0,1) != "." || $.inArray("a", params.shortform) >= 0)
								{
									output += "<li>"+i+"</li>";
								}
							}
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
						for(i in dirs)
						{
							if(current[dirs[i]])
							{
								directory.push(dirs[i]);
								current = current[dirs[i]];
							}
							else if(dirs[i] == "..")
							{
								directory.pop();
								current = getCurrentDirectory();
							}
							else
							{
								return "Oh no! Something went wonky!";
							}
						}
					}
					else
					{
						directory = new Array();
					}
				},
				help : "Changes the current directory the user is in"
			},
			mkdir : {
				execute : function(params) {
					current = getCurrentDirectory();
					current[params.target] = {};
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
				},
				help : "Creates a file, or if the file exists, updates the files timestamp",
			},
			rm : {
				execute : function(params) {
					current = getCurrentDirectory();
					delete current._files[params.target]
				},
				help : "Removes a file from the file tree",
			}
		}

		/**
		 * Gets the current directory in the file tree and returns that part of the object
		 * @return {object} 
		 */
		var getCurrentDirectory = function()
		{
			var current = settings.fileSystem;
			for(i in directory)
			{
				current = current[directory[i]];
			}
			return current;
		}

		var objectToString = function(o){
		    
		    var parse = function(_o){
		    
		        var a = [], t;
		        
		        for(var p in _o){
		        
		            if(_o.hasOwnProperty(p)){
		            
		                t = _o[p];
		                
		                if(t && typeof t == "object"){
		                
		                    a[a.length]= p + ":{" + arguments.callee(t).join(", ") + "}";
		                    
		                }
		                else {
		                    
		                    if(typeof t == "string"){
		                    
		                        a[a.length] = [ p+ ":\"" + t.toString() + "\"" ];
		                    }
		                    else{
		                        a[a.length] = [ p+ ":" + t.toString()];
		                    }
		                    
		                }
		            }
		        }
		        
		        return a;
		        
		    }
		    
		    return "{" + parse(o).join(", ") + "}";
		    
		}    

		// This is where the real meat of everything is....
		return this.each(function() {
			$this = $(this);
			// Add the jqcmd class and the style class
			$this.addClass("jqcmd").addClass(settings.style);
			$this.css("position", "relative");
			// Append the first line to the div
			$this.prepend('<div class="jqcmd_menu"><ul><li><a href=#">Export</a></li></ul></div>');
			$this.append('<div class="jqcmd_window">'+settings.loadScreen+'<p id="first"><span class="static">'+settings.hostname+'</span> > <span class="input"></span><span id="pointer"></span></p></div>');
			var position = $this.offset();
			// Clone the first line to use for later
			line = $this.find('#first').clone();
			$this.children('.jqcmd_menu').click(function(e) {
				e.preventDefault();
				var preparedString = objectToString(settings.fileSystem);
				preparedString = preparedString.replace(/</g, "&lt;");
				var other = window.open("", '_blank');
				window.focus();
				other.document.write(preparedString);
			});

			$this.keydown(function(e) {
				$pointer = $("#pointer");
				var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
				if(e.which == 46) //delete key
				{
					if(inTheMiddle)
					{
						var input = $pointer.prev().children(".after").text();
						var slicedString = input.slice(1);
						var firstLetter = input.slice(0, 1);
						$pointer.prev().children(".selected").text(firstLetter);
						$pointer.prev().children(".after").text(slicedString);
					}
				}
				else if(e.which == 9) //tab
				{
					e.preventDefault();
					complete($pointer.prev());
				}
				else if(e.which == 8) //backspace
				{
					e.preventDefault();
					if(inTheMiddle)
					{
						var string = $pointer.prev().children(".before").text().slice(0, -1);
						$pointer.prev().children(".before").text(string);
					}
					else
					{
						var string = $pointer.prev().text().slice(0, -1);
						$pointer.prev().text(string);						
					}
				}
				else if(e.which == 37) //left arrow
				{
					if(inTheMiddle)
					{
						var input = $pointer.prev().children(".before").text();
						var slicedString = input.slice(0, -1);
						var lastLetter = input.slice(-1);
						$pointer.prev().children(".after").text($pointer.prev().children(".selected").text()+$pointer.prev().children(".after").text());
						$pointer.prev().children(".selected").text(lastLetter);
						$pointer.prev().children(".before").text(slicedString);
					}
					else
					{
						var input = $pointer.prev().text();
						var slicedString = input.slice(0, -1);
						var lastLetter = input.slice(-1);
						$pointer.hide();
						$pointer.prev().html("<span class='before'>"+slicedString+"</span><span class='selected'>"+lastLetter+"</span><span class='after'></span>");
					}
				}
				else if(e.which == 39) //right arrow
				{
					if(inTheMiddle)
					{
						var input = $pointer.prev().children(".after").text();
						var slicedString = input.slice(1);
						var firstLetter = input.slice(0, 1);
						$pointer.prev().children(".before").text($pointer.prev().children(".before").text()+$pointer.prev().children(".selected").text());
						$pointer.prev().children(".selected").text(firstLetter);
						$pointer.prev().children(".after").text(slicedString);
					}
				}
				else if(e.which == 38 ) //up arrow
				{
					e.preventDefault();
					if(pointer < 0)
					{
						pointer = history.length-1;
					}
					else if(pointer > 0)
					{
						pointer--;
					}
					if(pointer >= 0)
					{
						$("#pointer").prev().text(history[pointer]);
					}
				}
				else if(e.which == 40) //down arrow
				{
					e.preventDefault();
					if(pointer > history.length-1)
					{
						pointer = history.length-1;
					}
					else if(pointer != history.length-1)
					{
						pointer++;
					}
					if(pointer <= history.length-1)
					{
						$("#pointer").prev().text(history[pointer]);
					}
				}
			});
			$this.keypress(function(e) {
				$pointer = $("#pointer");
				var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
				var keycode = null;
				if(window.event) {
					keycode = window.event.keyCode;
				}else if(e) {
					keycode = e.which;
				}
				// If the key isn't "enter" and the control key isn't pressed, then append the pressed key to the screen
				if(keycode != 13 && e.ctrlKey == false)
				{
					var key = String.fromCharCode(keycode);
					if(inTheMiddle)
					{
						$pointer.prev().children(".before").append(key);
					}
					else
					{
						$pointer.prev().append(key);						
					}
				}
				else
				{
					pointer = -1;
					// Run the function and get the input
					var output = run($("#pointer").prev().text());
					//clone a new line
					newLine = line.clone();
					// if the output doesn't clear the console
					if(output != "clearConsole")
					{
						// Append the current filetree location to the hostname
						var staticText = $(newLine).children(".static").text();
						for(i in directory)
						{
							if(directory[i] != "root")
							{
								staticText += "/"+directory[i];
							}
							$(newLine).children(".static").text(staticText);
						}
						// If there is output then print it to the screen.	
						if(output != undefined)
						{
							$('#pointer').parent().after("<div class='output'>"+output+"</div>");
							$('#pointer').remove();
							$('.output:last-child').after(newLine);					
						}
						else
						{
							$('#pointer').parent().after(newLine);
							$('#pointer').remove();
						}
					}
				}
				// Keep the scrollbar at the bottom of the screen.
				$this.animate({ scrollTop: $this[0].scrollHeight }, "fast");
			});
		});
	};
})( jQuery );