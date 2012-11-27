var filesystem = {
	about : {
		_files : {
			"me.exe" : {
				about : "It's me!",
				execute : function() {
					alert('execute works');
				}
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
				contents : "<h1>Resume</h1><p>Work I've done: <ul><li>one</li><li>two</li></ul>",
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