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
		                	console.log(p);                    
		                        a[a.length] = [ '"'+p+'"'+ ":" + t.toString()];
		                    }		                    
		                }
		            }
		        }
		        return a;		        
		    }
		    return "{" + parse(o).join(", ") + "}";
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
		vi = {
			command : false,
			file : '',
			newFile : false,
		}
		tabCount = 0;
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
		
		if(typeof(Storage)!=="undefined")
		{
			if(!localStorage.fileSystem)
			{
				localStorage.fileSystem = objectToString(settings.fileSystem);
			}
			else
			{
				var test = "return "+localStorage.fileSystem;
				console.log(test);
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
					return functions[command].execute(params);
				}
				catch(err)
				{
					console.log(err);
					parts = call.split(" ");
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

				if(current[found[0]])
				{
					returnText += "/";
				}

				$(input).text(returnText);
			}
			else if(found.length > 1)
			{
				if(tabCount == 0)
				{
					tabCount++;
					return;
				}
				var returnText = '';
				for(i in found)
				{
					returnText += "<p class='ls_list'>"+found[i]+"</p>"
				}
				newLine = $('#pointer').parent().clone();
				$('#pointer').parent().after("<div class='output'>"+returnText+"</div>");
				$('#pointer').remove();
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
				execute : function(params) {
					var output = "<ul>";
					var current = getCurrentDirectory();
					console.log(current);
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
					current = getCurrentDirectory();
					var fileText;
					var newFile;
					if(current._files[params.target])
					{
						fileText = current._files[params.target].contents;
						vi.newFile = false;
					}
					else
					{
						vi.newFile = true;
						fileText = "";
					}
					vi.filename = params.target;
					viLoad(fileText, newFile);
				},
				help : "A simple text editor for the command line",
			},
		}

		var navigation = function($pointer, e, deleteOption, callback)
		{
			if(!deleteOption){
				deleteOption = false;
			}
			var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
			if(deleteOption == true)
			{
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
					if($pointer.prev().text() == '')
					{
						$pointer.prev().html($pointer.prev().text());
						$pointer.show();
					}
				}
			}
			else
			{
				if(e.which == 8)
				{
					e.preventDefault();
				}
			}
			if(e.which == 37) //left arrow
			{
				if(inTheMiddle)
				{
					var input = $pointer.prev().children(".before").text();
					if(input.length > 0)
					{
						var slicedString = input.slice(0, -1);
						var lastLetter = input.slice(-1);
						$pointer.prev().children(".after").text($pointer.prev().children(".selected").text()+$pointer.prev().children(".after").text());
						$pointer.prev().children(".selected").text(lastLetter);
						$pointer.prev().children(".before").text(slicedString);						
					}
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

			if(callback)
			{
				callback();
			}	
		}
		var viLoad = function(fileText, newFile) {
			
			$(".jqcmd_window").hide().after("<div id='viWindow'></div><p id='viInput'></p>");
			var docHeight = $(window).height();
			if(fileText == '')
			{
				$("#viWindow").prepend("<p id='current_line'><span class='input'></span><span id='viPointer'></span></p>");
			}
			else
			{
				$("#viWindow").prepend(fileText.replace(/\\('|")/gi, "$1"));
				$("#viWindow p:first-child").attr("id", "current_line");
				var text = $("#viWindow p:first-child").text();
				var slicedString = text.slice(1);
				var firstLetter = text.slice(0,1);
				inTheMiddle = true;
				$("#viWindow p:first-child").html("<span class='input'><span class='before'></span><span class='selected'>"+firstLetter+"</span><span class='after'>"+slicedString+"</span></span><span id='viPointer'></span>");
				$("#viPointer").hide();
			}
			var x = 0;
			while(x < 100)
			{
				$("#viWindow").append("<p class='empty'>~</p>");
				x++;
			}
			$this.off("keydown.mainKeyDown");
			$this.off("keypress.mainKeyPress");

			$this.on("keydown.viKeyDown", viKeyDown);
			$this.on("keypress.viKeyPress", viKeyPress);
		}
		var viUnload = function() {
			vi.command = false;
			$("#viWindow").remove();
			$("#viInput").remove();
			$(".jqcmd_window").show();
			$this.off("keydown.viKeyDown");
			$this.off("keypress.viKeyPress");
			$this.on("keydown.mainKeyDown", mainKeyDown);
			$this.on("keypress.mainKeyPress", mainKeyPress);
			fileTreeUpdate();

		}

		var viKeyDown = function(e)
		{
			if(!vi.command)
			{
				$pointer = $("#viPointer");
				var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
				navigation($pointer, e);
			}
			else
			{
				$pointer = $("#commandPointer");
				var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
				navigation($pointer, e, true, function() {
					if(e.which == 8 && $pointer.prev().text() == '')
					{
						$("#viInput").html('');
						$("#viPointer").show();
						if($("#viPointer").prev().children(".pointerHolder").length > 0)
						{
							$("#viPointer").prev().children(".pointerHolder").remove();
						}
						vi.command = false;					
					}
				});		
			}
		}
		var viKeyPress = function(e)
		{
			var keycode = null;
			if(window.event) {
				keycode = window.event.keyCode;
			}else if(e) {
				keycode = e.which;
			}
			var key = String.fromCharCode(keycode);
			if(!vi.command)
			{
				if(key == "a")
				{
					$("#viInput").html("-- INSERT --");
					$this.off("keypress.viKeyPress");
					$this.off("keydown.viKeyDown");
					$this.on("keypress.viInsertKeyPress", viInsertKeyPress);
					$this.on("keydown.viInsertKeyDown", viInsertKeyDown);
				}
				else if(keycode == 58) //colon
				{
					$("#viInput").html("<span>:</span><span id='commandPointer' class='blinker'></span>");
					$("#viPointer").hide();
					if($("#viPointer").prev().text() == '')
					{
						$("#viPointer").prev().html("<span class='pointerHolder'> </span>")
					}
					vi.command = true;
				}					
			}
			else
			{
				// If the key isn't "enter" and the control key isn't pressed, then append the pressed key to the screen
				if(keycode != 13 && e.ctrlKey == false)
				{
					var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
					var key = String.fromCharCode(keycode);
					if(inTheMiddle)
					{
						$pointer.prev().children(".before").append(key);
					}
					else
					{
						$("#commandPointer").prev().append(key);
					}
				}
				else
				{
					var commandInput = $pointer.prev().text().slice(1);
					processInput(commandInput);
				}
			}
		}

		var processInput = function(command)
		{
			switch(command)
			{
				case "q!":
					viUnload();
					break;
				case "wq":
					current = getCurrentDirectory();
					$("#current_line").html($("#current_line").text());
					$(".empty").remove();
					console.log($("#current_line").html());
					if(vi.filename.match(/\.exe$/))
					{
						viUpdateFile(vi.filename, $("#viWindow").html(), $("#viWindow").text());
					}
					else
					{
						viUpdateFile(vi.filename, $("#viWindow").html());
					}
					viUnload();
					break;
				case "x":
					current = getCurrentDirectory();
					$("#current_line").html($("#current_line").text());
					$(".empty").remove();
					if(vi.filename.match(/\.exe$/))
					{
						viUpdateFile(vi.filename, $("#viWindow").html(), $("#viWindow").text());
					}
					else
					{
						viUpdateFile(vi.filename, $("#viWindow").html());
					}
					viUnload();
					break;
			}
		}

		var viUpdateFile = function(filename, txt, func)
		{
			current = getCurrentDirectory();
			if(filename.match(/\.exe$/))
			{
				var adder = new Function(func);
				parsedTxt = txt.replace(/("|'")/gi, "\\\\\\$1");
				console.log(parsedTxt);
				 
				if(current._files[filename])
				{
					current._files[filename].execute = adder;
					current._files[filename].contents = parsedTxt;
				}
				else
				{
					current._files[filename] =  {
						execute : adder,
						contents : parsedTxt,
					};
				}
			}
			else
			{
				if(current._files[filename])
				{
					current._files[filename].contents = parsedTxt;
				}
				else
				{
					current._files[filename] =  {
						contents : parsedTxt,
					};
				}			

			}
		}
		var viInsertKeyDown = function(e)
		{
			if(window.event) {
				keycode = window.event.keyCode;
			}else if(e) {
				keycode = e.which;
			}
			$pointer = $("#viPointer");
			var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;

			if(keycode == 27)
			{
				$this.off("keypress.viInsertKeyPress");
				$this.off("keydown.viInsertKeyDown");
				$this.on("keydown.viKeyDown", viKeyDown);
				$this.on("keypress.viKeyPress", viKeyPress);
				
				$("#viInput").html("");
			}
			navigation($pointer, e, true);
		}

		var viInsertKeyPress = function(e)
		{
			var keycode = null;
			if(window.event) {
				keycode = window.event.keyCode;
			}else if(e) {
				keycode = e.which;
			}
			// If the key isn't "enter" and the control key isn't pressed, then append the pressed key to the screen
			if(keycode != 13 && e.ctrlKey == false)
			{
				var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
				var key = String.fromCharCode(keycode);
				if(inTheMiddle)
				{
					$pointer.prev().children(".before").append(key);
				}
				else
				{
					$("#current_line .input").append(key);
				}
			}
			else
			{
				if($("#current_line").next().hasClass("empty"))
				{
					$next = $("#current_line").next();
					$("#current_line").html($("#current_line").text());
					$("#current_line").removeAttr("id");
					$next.attr("id", "current_line").html("<span class='input'></span><span id='viPointer'></span>")
				}
			}
		}

		/**
		 * Gets the current directory in the file tree and returns that part of the object
		 * @return {object} 
		 */
		var getCurrentDirectory = function()
		{
			console.log(settings);
			var current = settings.fileSystem;
			for(i in directory)
			{
				current = current[directory[i]];
			}
			return current;
		}



		var mainKeyDown = function(e) {
			$pointer = $("#pointer");
			var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;

			if(e.which == 9) //tab
			{
				e.preventDefault();
				complete($pointer.prev());
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
			else
			{
				navigation($pointer, e, true);
			}
		}

		var mainKeyPress = function(e) {
			$pointer = $("#pointer");
			var inTheMiddle = ($pointer.prev().children(".before").length > 0) ? true : false;
			var keycode = null;
			if(window.event) {
				keycode = window.event.keyCode;
			}else if(e) {
				keycode = e.which;
			}
			if(tabCount > 0)
			{
				tabCount = 0;
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
		}

		// This is where the real meat of everything is....
		return this.each(function() {
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

			$this.on("keydown.mainKeyDown", mainKeyDown);
			$this.on("keypress.mainKeyPress", mainKeyPress);
		});
	};
})( jQuery );