(function( $ ){

  $.fn.jqcmd = function( custom ) {  

	var directory = new Array();
	var history = new Array();
	var pointer = -1;
	var line;
	var element = this;

    // Create some defaults, extending them with any options that were provided
    var settings = $.extend( {
    	"fileSystem" : {}
    }, custom);

	var run = function(call) {
		call = $.trim(call);
		history.push(call);
		if(call.match(/\.[a-z]+$/))
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
			try
			{
				parts = call.split(" ");
				return functions[parts.shift()].execute(parts);
			}
			catch(err)
			{
				console.log(err);
				parts = call.split(" ");
				return "That function does not exist. For help and a list of functions, type \"help\"";
			}

		}
	}
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
	var functions = {
		clear : {
			execute : function (options) {
				element.empty().html(line.clone());
				return "clearConsole";
			},
			help : "clears the screen of all text"
		},

		ls : {
			execute : function(options) {
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
							output += "<li>"+i+"</li>";
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
			execute : function(options) {
				if(options[0] != "/")
				{
					if(options[0].charAt( options[0].length-1 ) == "/")
					{
						options[0] = options[0].slice(0, -1);
					}
					var dirs = options[0].split("/");
					var childDir = options[0];
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
					directory = new Array("root");
				}
			},
			help : "Changes the current directory the user is in"
		}
	}

	var getCurrentDirectory = function()
	{
		var current = settings.fileSystem;
		for(i in directory)
		{
			current = current[directory[i]];
		}
		return current;
	}

    return this.each(function() {
    	$this = $(this);
    	$this.addClass("jqcmd");
    	$this.append('<p id="first"><span class="static">kevinbaugh.com</span> > <span class="input"></span><span id="pointer"></span></p>')    
		line = $this.children('#first').clone();
		$this.keydown(function(e) {
			if(e.which == 46)
			{
				var string = $("#pointer").prev().text().slice(0, -1);
				$("#pointer").prev().text(string);
			}
			else if(e.which == 9) //tab
			{
				e.preventDefault();
				complete($("#pointer").prev());
			}
			else if(e.which == 8) //backspace
			{
				e.preventDefault();
				var string = $("#pointer").prev().text().slice(0, -1);
				$("#pointer").prev().text(string);
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
	        var keycode = null;
	        if(window.event) {
	            keycode = window.event.keyCode;
	        }else if(e) {
	            keycode = e.which;
	        }
			if(keycode != 13 && e.ctrlKey == false)
			{
		        var key = String.fromCharCode(keycode);
				$("#pointer").prev().append(key);
			}
			else
			{
				var output = run($("#pointer").prev().text());
				newLine = line.clone();
				if(output != "clearConsole")
				{
					var staticText = $(newLine).children(".static").text();
					for(i in directory)
					{
						if(directory[i] != "root")
						{
							staticText += "/"+directory[i];
						}
						$(newLine).children(".static").text(staticText);
					}				
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
			$this.animate({ scrollTop: $this.height() }, "fast");
		});
    });
  };
})( jQuery );