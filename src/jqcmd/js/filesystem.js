var filesystem = {
	_folders : {
		about : {
			_folders : {},
			_files : {
				"me.exe" : {
					about : "It's me!",
					execute : function() {
						alert("execute works");
					},
				}
			}
		},
		contact : {
			_folders : {},
			_files : {
				"email.exe" : {
					about : "Send me an email!",
					execute : function() {
						alert('execute works');
					}
				}
			}
		},
		portfolio : {
			_folders : {
				work : {
					_files: {
						"battleship.exe" : {
							about : "Battleship",
							location : "http://www.kevinbaugh.com/battleship"
						}
					}
				}				
			},
			_files : {
				"resume.txt" : {
					about : "Resume",
					contents : "<p>Resume</p><p>Work I've done: <p>one</p><p>two</p>",
				}
			}
		},
	},
	_files : {
		".ignore" : {},
		"new.txt" : {
			contents : "<p>Resume</p><p>Work I've done:</p><p>one</p><p>two</p>",
		}
	}
}