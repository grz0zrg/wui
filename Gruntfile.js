module.exports = function(grunt) {
  	grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
 
    	uglify: {
      		options: {
        		banner: '',
        		mangle: true,
        		maxLineLen: 0,
        		compress: {
        			sequences: true,
        			properties: true,
        			dead_code: true,
        			drop_debugger: true,
        			unsafe: true,
        			conditionals: true,
        			comparisons: true,
        			evaluate: true,
        			booleans: true,
        			loops: true,
        			unused: true,
        			hoist_funs: true,
        			if_return: true,
        			join_vars: true,
        			cascade: true,
        			warnings: true,
        			negate_iife: true,
        			pure_getters: true
        		},
        		preserveComments: false,
        		screwIE8: true,
        		mangleProperties: true,
        		reserveDOMProperties: true
      		},
 
		  	target: {
		    	files: {
		      		'dist/wui.min.js': ['wui/js/wui.js', 'wui/js/wui_dialog.js', 'wui/js/wui_dropdown.js', 'wui/js/wui_range_slider.js', 'wui/js/wui_tabs.js', 'wui/js/wui_toolbar.js']
		    	}
		  	}
    	},
    	
		cssmin: {
		  	options: {
				shorthandCompacting: true,
				roundingPrecision: -1
		  	},
		  	
		  	target: {
				files: {
			  		'dist/wui.min.css': ['wui/css/wui_dialog.css', 'wui/css/wui_dropdown.css', 'wui/css/wui_range_slider.css', 'wui/css/wui_tabs.css', 'wui/css/wui_toolbar.css']
				}
		  	}
		},
		
		compress: {
			options: {
				mode: 'gzip',
				level: 9
			},
			
			target: {
				files: [
					{expand: true, src: ['dist/wui.min.js'],  dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/wui.min.css'], dest: '', ext: '.gz.css'}
				]
			}
		}
  	});
 
 	grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
  	grunt.loadNpmTasks('grunt-contrib-uglify');
  	
  	grunt.registerTask('dist', ['cssmin', 'uglify', 'compress']);
}
