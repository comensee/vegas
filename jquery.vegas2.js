
(function( $ ){
    var $background = $( '<img />' ).addClass( 'vegas-background' );
        $overlay    = $( '<div />' ).addClass( 'vegas-overlay' );
        $loading    = $( '<div />' ).addClass( 'vegas-loading' );
        $current    = $();
        paused = null;
        backgrounds = [];
        step = 0;
		delay = 5000;
		walk = function() {};
        timer = 0;

    var defaults = {
        background: {
            // src:         string
            // align:       string/int
            // valign:      string/int
            // fade:        int
            // loading      bool
            // load:        function
            // complete:    function
        },
        slideshow: {
            // step:        int
            // delay:       int
            // backgrounds: array
            // preload:     bool
            // walk:        function
        },
        overlay: {
            // src:         string
            // opacity:     float
        },
        cur_bloc : $('body')
    }


    var methods = {
        init : function( settings ) {
            
            var options = {
                src: getBackground(),
                align: 'center',
                valign: 'center',
                fade: 0,
                loading: true,
                load: function() {},
                complete: function() {}
            }
            $.extend( options, defaults, settings );
            defaults.cur_bloc = $(this);
            if ( options.loading ) {
                loading();
            }
            var $new = $background.clone();
            $new.css( {
                'position': 'fixed',
                'left': '0px',
                'top': '0px'
            })
            .imagesLoadedForVegas( function() {
                if ( $new == $current ) {
                    return;
                }
                
                defaults.cur_bloc.bind( 'resize.vegas', function( e ) {
                    resize( $new, options );
                });

                if ( $current.is( 'img' ) ) {

                    $current.stop();

                    $new.hide()
                        .insertAfter( $current )
                        .fadeIn( options.fade, function() {
                            $('.vegas-background')
                                .not(this)
                                    .remove();
                            defaults.cur_bloc.trigger( 'vegascomplete', [ this, step - 1 ] );
                            options.complete.apply( $new, [ step - 1 ] );
                        });
                } else {
                    $new.hide()
                        .prependTo( 'body' )
                        .fadeIn( options.fade, function() {
                            defaults.cur_bloc.trigger( 'vegascomplete', [ this, step - 1 ] );
                            options.complete.apply( this, [ step - 1 ] );
                        });
                }

                $current = $new;

                resize( $current, options );

                if ( options.loading ) {
                    loaded();
                }

                defaults.cur_bloc.trigger( 'vegasload', [ $current.get(0), step - 1 ] );
                options.load.apply( $current.get(0), [ step - 1 ] );

                if ( step ) {
                    defaults.cur_bloc.trigger( 'vegaswalk', [ $current.get(0), step - 1 ] );
                    options.walk.apply( $current.get(0), [ step - 1 ] );
                }
            })
            .attr( 'src', options.src );

            return defaults.cur_bloc;
        },
        // Destroy background and/or overlay
        destroy: function( what ) {
            if ( !what || what == 'background') {
                $( '.vegas-background, .vegas-loading' ).remove();
                defaults.cur_bloc.unbind( 'resize.vegas' );
                $current = null;
            }

            if ( what == 'overlay') {
                $( '.vegas-overlay' ).remove();
            }

            return defaults.cur_bloc;
        },

        // Display the pattern overlay
        overlay: function( settings ) {
            var options = {
                src: null,
                opacity: null
            };
            $.extend( options, defaults.overlay, settings );
            defaults.cur_bloc = $(this);
            $overlay.remove();

            $overlay
                .css( {
                    'margin': '0',
                    'padding': '0',
                    'position': 'fixed',
                    'left': defaults.cur_bloc.offset().left,
                    'top': defaults.cur_bloc.offset().top,
                    'width': defaults.cur_bloc.width(),
                    'height': defaults.cur_bloc.height()
            });

            if ( options.src ) {
                $overlay.css( 'backgroundImage', 'url(' + options.src + ')' );
            }

            if ( options.opacity ) {
                $overlay.css( 'opacity', options.opacity );
            }

            $overlay.prependTo( 'body' );

            return defaults.cur_bloc;
        },

        // Start/restart slideshow
        slideshow: function( settings, keepPause ) {
            var options = {
                step: step,
                delay: delay,
                preload: false,
                backgrounds: backgrounds,
                walk: walk
            };

            $.extend( options, defaults.slideshow, settings );
             defaults.cur_bloc = $(this);
            if ( options.backgrounds != backgrounds ) {
                if ( !settings.step ) {
                    options.step = 0;
                }

                if ( !settings.walk ) {
                    options.walk = function() {};
                }

                if ( options.preload ) {
                   defaults.cur_bloc.vegas( 'preload', options.backgrounds );
                }
            }

            backgrounds = options.backgrounds;
			delay = options.delay;
            step = options.step;
			walk = options.walk;

            clearInterval( timer );

            if ( !backgrounds.length ) {
                return defaults.cur_bloc;
            }

            var doSlideshow = function() {
                if ( step < 0 ) {
                    step = backgrounds.length - 1;
                }

                if ( step >= backgrounds.length || !backgrounds[ step - 1 ] ) {
                    step = 0;
                }

                var settings = backgrounds[ step++ ];
                settings.walk = options.walk;

                if ( settings.fade > options.delay ) {
                    settings.fade = options.delay;
                }

                defaults.cur_bloc.vegas( settings );
            }
            doSlideshow();

            if ( !keepPause ) {
                paused = false;

                defaults.cur_bloc.trigger( 'vegasstart', [ $current.get(0), step - 1 ] );
            }

            if ( !paused ) {
                timer = setInterval( doSlideshow, options.delay );
            }

            return defaults.cur_bloc;
        },

        // Jump to the next background in the current slideshow
        next: function() {
            var from = step;

            if ( step ) {
               defaults.cur_bloc.vegas( 'slideshow', { step: step }, true );

                defaults.cur_bloc.trigger( 'vegasnext', [ $current.get(0), step - 1, from - 1 ] );
            }

            return defaults.cur_bloc;
        },

        // Jump to the previous background in the current slideshow
        previous: function() {
            var from = step;

            if ( step ) {
               defaults.cur_bloc.vegas( 'slideshow', { step: step - 2 }, true );

                defaults.cur_bloc.trigger( 'vegasprevious', [ $current.get(0), step - 1, from - 1 ] );
            }

            return defaults.cur_bloc;
        },

        // Jump to a specific background in the current slideshow
        jump: function( s ) {
            var from = step;

            if ( step ) {
               defaults.cur_bloc.vegas( 'slideshow', { step: s }, true );

                defaults.cur_bloc.trigger( 'vegasjump', [ $current.get(0), step - 1, from - 1 ] );
            }

            return defaults.cur_bloc;
        },

        // Stop slideshow
        stop: function() {
            var from = step;
            step = 0;
            paused = null;
            clearInterval( timer );

            defaults.cur_bloc.trigger( 'vegasstop', [ $current.get(0), from - 1 ] );

            return defaults.cur_bloc;
        },

        // Pause slideShow
        pause: function() {
            paused = true;
            clearInterval( timer );

            defaults.cur_bloc.trigger( 'vegaspause', [ $current.get(0), step - 1 ] );

            return defaults.cur_bloc;
        },

        // Get some useful values or objects
        get: function( what ) {
            if ( what == null || what == 'background' ) {
                return $current.get(0);
            }

            if ( what == 'overlay' ) {
                return $overlay.get(0);
            }

            if ( what == 'step' ) {
                return step - 1;
            }

            if ( what == 'paused' ) {
                return paused;
            }
        },

        // Preload an array of backgrounds
        preload: function( backgrounds ) {
            for( var i in backgrounds ) {
                if ( backgrounds[ i ].src ) {
                    $('<img src="' + backgrounds[ i ].src + '">');
                }
            }

            return defaults.cur_bloc;
        }
    }

    // Resize the background
    function resize( $img, settings ) {
        var options =  {
            align: 'center',
            valign: 'center'
        }
        $.extend( options, settings );

        var ww = $( defaults.cur_bloc ).width(),
            wh = $( defaults.cur_bloc ).height(),
            iw = $img.width(),
            ih = $img.height(),
            rw = wh / ww,
            ri = ih / iw,
            newWidth, newHeight,
            newLeft, newTop,
            properties;

        if ( rw > ri ) {
            newWidth = wh / ri;
            newHeight = wh;
        } else {
            newWidth = ww;
            newHeight = ww * ri;
        }

        properties = {
            'width': newWidth + 'px',
            'height': newHeight + 'px',
			'top': 'auto',
			'bottom': 'auto',
			'left': 'auto',
			'right': 'auto'
        }

        if ( !isNaN( parseInt( options.valign ) ) ) {
            properties[ 'top' ] = ( 0 - ( newHeight - wh ) / 100 * parseInt( options.valign ) ) + 'px';
        } else if ( options.valign == 'top' ) {
            properties[ 'top' ] = 0;
        } else if ( options.valign == 'bottom' ) {
            properties[ 'bottom' ] = 0;
        } else {
            
            properties[ 'top' ] = defaults.cur_bloc.offset().top;
        }

        if ( !isNaN( parseInt( options.align ) ) ) {
            properties[ 'left' ] = ( 0 - ( newWidth - ww ) / 100 * parseInt( options.align ) ) + 'px';
        } else if ( options.align == 'left' ) {
            properties[ 'left' ] = 0;
        } else if ( options.align == 'right' ) {
            properties[ 'right' ] = 0;
        } else {
            properties[ 'left' ] = defaults.cur_bloc.offset().left;
        }

        $img.css( properties );
    }

    // Display the loading indicator
    function loading() {
        $loading.prependTo( 'body' ).fadeIn();
    }

    // Hide the loading indicator
    function loaded() {
        $loading.fadeOut( 'fast', function() {
            $( this ).remove();
        });
    }

    // Get the background image from the body
    function getBackground() {
        if ( defaults.cur_bloc.css( 'backgroundImage' ) ) {
            return defaults.cur_bloc.css( 'backgroundImage' ).replace( /url\("?(.*?)"?\)/i, '$1' );
        }
    }


    /*!
     * jQuery imagesLoaded plugin v1.0.3
     * http://github.com/desandro/imagesloaded
     *
     * MIT License. by Paul Irish et al.
     */
    $.fn.imagesLoadedForVegas = function( callback ) {
        var $this = this,
            $images = $this.find('img').add( $this.filter('img') ),
            len = $images.length,
            blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

        function triggerCallback() {
          callback.call( $this, $images );
        }

        function imgLoaded() {
          if ( --len <= 0 && this.src !== blank ){
            setTimeout( triggerCallback );
            $images.unbind( 'load error', imgLoaded );
          }
        }

        if ( !len ) {
          triggerCallback();
        }

        $images.bind( 'load error',  imgLoaded ).each( function() {
          // cached images don't fire load sometimes, so we reset src.
          if (this.complete || this.complete === undefined){
            var src = this.src;
            // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
            // data uri bypasses webkit log warning (thx doug jones)
            this.src = blank;
            this.src = src;
          }
        });

        return $this;
      };

    $.fn.vegas = function( method ) {
        
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist ' );
        }
    };


})( jQuery );