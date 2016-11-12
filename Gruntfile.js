var js_arr = ['wui/js/wui_dialog.js', 'wui/js/wui_dropdown.js', 'wui/js/wui_range_slider.js', 'wui/js/wui_tabs.js', 'wui/js/wui_toolbar.js', 'wui/js/wui_circular_menu.js', 'wui/js/wui.js'];

module.exports = function(grunt) {
  	grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
 
 		concat: {
 			dist: {
 				files: {
					'dist/wui.js': js_arr,
 					'dist/dark/wui.css': ['wui/css/themes/dark/wui_dialog.css', 'wui/css/themes/dark/wui_dropdown.css', 'wui/css/themes/dark/wui_range_slider.css', 'wui/css/themes/dark/wui_tabs.css', 'wui/css/themes/dark/wui_toolbar.css', 'wui/css/themes/dark/wui_circular_menu.css', 'wui/css/wui.css'],
 					'dist/bright/wui.css': ['wui/css/themes/bright/wui_dialog.css', 'wui/css/themes/bright/wui_dropdown.css', 'wui/css/themes/bright/wui_range_slider.css', 'wui/css/themes/bright/wui_tabs.css', 'wui/css/themes/bright/wui_toolbar.css', 'wui/css/themes/bright/wui_circular_menu.css', 'wui/css/wui.css']
 				}
 			}
 		},

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
        		mangleProperties: false,
        		reserveDOMProperties: true
      		},
 
		  	target: {
		    	files: {
		      		'dist/wui.min.js': ['wui/js/wui_dialog.js', 'wui/js/wui_dropdown.js', 'wui/js/wui_range_slider.js', 'wui/js/wui_tabs.js', 'wui/js/wui_toolbar.js', 'wui/js/wui_circular_menu.js', 'wui/js/wui.js'],

					'dist/widgets/WUI.min.js':                                ['wui/js/wui.js'],
		      		'dist/widgets/WUI_Dialog/wui_dialog.min.js':              ['wui/js/wui_dialog.js'],
		      		'dist/widgets/WUI_DropDown/wui_dropdown.min.js':          ['wui/js/wui_dropdown.js'],
		      		'dist/widgets/WUI_RangeSlider/wui_range_slider.min.js':   ['wui/js/wui_range_slider.js'],
		      		'dist/widgets/WUI_Tabs/wui_tabs.min.js':                  ['wui/js/wui_tabs.js'],
		      		'dist/widgets/WUI_ToolBar/wui_toolbar.min.js':            ['wui/js/wui_toolbar.js'],
                    'dist/widgets/WUI_CircularMenu/wui_circular_menu.min.js': ['wui/js/wui_circular_menu.js']
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
			  		'dist/dark/wui.min.css': ['wui/css/themes/dark/wui_dialog.css', 'wui/css/themes/dark/wui_dropdown.css', 'wui/css/themes/dark/wui_range_slider.css', 'wui/css/themes/dark/wui_tabs.css', 'wui/css/themes/dark/wui_toolbar.css', 'wui/css/themes/dark/wui_circular_menu.css', 'wui/css/wui.css'],
			  		'dist/bright/wui.min.css': ['wui/css/themes/bright/wui_dialog.css', 'wui/css/themes/bright/wui_dropdown.css', 'wui/css/themes/bright/wui_range_slider.css', 'wui/css/themes/bright/wui_tabs.css', 'wui/css/themes/bright/wui_toolbar.css', 'wui/css/themes/bright/wui_circular_menu.css', 'wui/css/wui.css'],

                    'dist/widgets/WUI.min.css':                                     ['wui/css/wui.css'],
		      		'dist/widgets/WUI_Dialog/dark/wui_dialog.min.css':              ['wui/css/themes/dark/wui_dialog.css'],
		      		'dist/widgets/WUI_DropDown/dark/wui_dropdown.min.css':          ['wui/css/themes/dark/wui_dropdown.css'],
		      		'dist/widgets/WUI_RangeSlider/dark/wui_range_slider.min.css':   ['wui/css/themes/dark/wui_range_slider.css'],
		      		'dist/widgets/WUI_Tabs/dark/wui_tabs.min.css':                  ['wui/css/themes/dark/wui_tabs.css'],
		      		'dist/widgets/WUI_ToolBar/dark/wui_toolbar.min.css':            ['wui/css/themes/dark/wui_toolbar.css'],
                    'dist/widgets/WUI_CircularMenu/dark/wui_circular_menu.min.css': ['wui/css/themes/dark/wui_circular_menu.css'],
                    
                   'dist/widgets/WUI.min.css':                                ['wui/css/wui.css'],
		      		'dist/widgets/WUI_Dialog/bright/wui_dialog.min.css':              ['wui/css/themes/bright/wui_dialog.css'],
		      		'dist/widgets/WUI_DropDown/bright/wui_dropdown.min.css':          ['wui/css/themes/bright/wui_dropdown.css'],
		      		'dist/widgets/WUI_RangeSlider/bright/wui_range_slider.min.css':   ['wui/css/themes/bright/wui_range_slider.css'],
		      		'dist/widgets/WUI_Tabs/bright/wui_tabs.min.css':                  ['wui/css/themes/bright/wui_tabs.css'],
		      		'dist/widgets/WUI_ToolBar/bright/wui_toolbar.min.css':            ['wui/css/themes/bright/wui_toolbar.css'],
                    'dist/widgets/WUI_CircularMenu/bright/wui_circular_menu.min.css': ['wui/css/themes/bright/wui_circular_menu.css']
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
					{expand: true, src: ['dist/dark/wui.min.css'], dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/bright/wui.min.css'], dest: '', ext: '.gz.css'},

                    {expand: true, src: ['dist/widgets/WUI.min.css'],                                dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_Dialog/dark/wui_dialog.min.css'],              dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_DropDown/dark/wui_dropdown.min.css'],          dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_RangeSlider/dark/wui_range_slider.min.css'],   dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_Tabs/dark/wui_tabs.min.css'],                  dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_ToolBar/dark/wui_toolbar.min.css'],            dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_CircularMenu/dark/wui_circular_menu.min.css'], dest: '', ext: '.gz.css'},
					
                    {expand: true, src: ['dist/widgets/WUI.min.css'],                                dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_Dialog/bright/wui_dialog.min.css'],              dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_DropDown/bright/wui_dropdown.min.css'],          dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_RangeSlider/bright/wui_range_slider.min.css'],   dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_Tabs/bright/wui_tabs.min.css'],                  dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_ToolBar/bright/wui_toolbar.min.css'],            dest: '', ext: '.gz.css'},
					{expand: true, src: ['dist/widgets/WUI_CircularMenu/bright/wui_circular_menu.min.css'], dest: '', ext: '.gz.css'},

                    {expand: true, src: ['dist/widgets/WUI.min.js'],                                dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/widgets/WUI_Dialog/wui_dialog.min.js'],              dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/widgets/WUI_DropDown/wui_dropdown.min.js'],          dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/widgets/WUI_RangeSlider/wui_range_slider.min.js'],   dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/widgets/WUI_Tabs/wui_tabs.min.js'],                  dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/widgets/WUI_ToolBar/wui_toolbar.min.js'],            dest: '', ext: '.gz.js'},
					{expand: true, src: ['dist/widgets/WUI_CircularMenu/wui_circular_menu.min.js'], dest: '', ext: '.gz.js'}
				]
			}
		}
  	});
 
 	grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
  	grunt.loadNpmTasks('grunt-contrib-uglify');
  	grunt.loadNpmTasks('grunt-contrib-concat');
  	
  	grunt.registerTask('dist', ['concat', 'cssmin', 'uglify', 'compress']);
}
