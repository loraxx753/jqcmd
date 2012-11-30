var filesystem = {
	about : {
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
		work : {
			_files: {
				"battleship.exe" : {
					about : "Battleship",
					location : "http://www.kevinbaugh.com/battleship"
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
	test : {
		another : ['stuff'],
		again : ['more stuff'],
		deep : {
			deeper : {
				_files : {
					"more.exe" : {
						about : "It's google!",
						location : "http://www.google.com",
					}
				}
			}
		}
	},
	_files : {
		".ignore" : {},
		"new.txt" : {}
	}
}