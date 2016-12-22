$( document )
    .ready( function () {
        //Setup caching
        $.ajaxSetup( {
            cache: true
        } );

        /**
         * Grab the Facebook SDK and attempt to login/auth. We need them logged in
         * so that we can search FB as their account and access profiles that might
         * otherwise be private but not to the current user.
         */
        $.getScript( 'https://connect.facebook.net/en_US/sdk.js', function () {
            FB.init( {
                //App ID for this project
                appId: '204639986629939',
                version: 'v2.8'
            } );

            $( '#loginbutton,#feedbutton' )
                .removeAttr( 'disabled' );

            FB.getLoginStatus( function ( response ) {
                if ( response.status === 'connected' ) {
                    new PNotify( {
                        title: 'Success',
                        text: 'Successfully connected to Facebook!',
                        type: 'success'
                    } );

                    //Set the response to sessionStorage
                    sessionStorage.setItem( 'fbAccount', JSON.stringify( response ) );

                    //Enable the serch bar
                    enableSearchBar();
                } else {
                    FB.login( function fbLogin( response ) {

                        if ( response.status === 'connected' ) {
                            new PNotify( {
                                title: 'Success',
                                text: 'Successfully connected to Facebook!',
                                type: 'success'
                            } );

                            //Set the response to sessionStorage
                            sessionStorage.setItem( 'fbAccount', JSON.stringify( response ) );

                            enableSearchBar();
                        } else {
                            new PNotify( {
                                title: 'Error',
                                text: 'Could not connect to Facebook.',
                                type: 'error'
                            } );
                        }
                    }, {
                        scope: [ 'email', 'user_posts' ]
                    } );
                }
            } );

            //Bind the search bar to the FB search
            $( '#fbaccount' )
                .autocomplete( {
                    source: function ( request, response ) {
                        searchFBAccounts( request.term, function ( data ) {
                            console.log( 'fb seasrch data', data );
                            response( data );
                        } );
                    },
                    minLength: 3,
                    select: function ( event, ui ) {
                        $( '.selected-account' )
                            .empty();
                        $( '.selected-account' )
                            .append( '<img src="' + ui.item.image + '"><br>' + ui.item.name );
                        $( '#fbaccount' )
                            .val( ui.item.name + ' - ' + ui.item.id );

                        return false;
                    }
                } )
                .autocomplete( "instance" )
                ._renderItem = function ( ul, item ) {
                    return $( '<li>' )
                        .append( '<img src="' + item.image + '">' + item.name )
                        .appendTo( ul );
                };

            $( '#analyze' )
                .on( 'click', function () {
                    //Get the account info
                    var fbid = $( '#fbaccount' )
                        .val()
                        .split( ' - ' )[ 1 ];
                    var requestFields = [
                        'id',
                        'created_time',
                        // 'description',
                        // 'from',
                        // 'link',
                        'message',
                        // 'name',
                        // 'story',
                        // 'to',
                        // 'type',
                        'comments.summary(1)',
                        // 'likes.summary(1)'
                    ];
                    var params = {
                        since: moment( moment()
                                .subtract( 5, 'years' ), 'YYYY-MM-DD hh:mm A' )
                            .unix(),
                        until: moment( moment(), 'YYYY-MM-DD hh:mm A' )
                            .unix(),
                        limit: 200,
                        fields: requestFields.join( ',' )
                    };

                    var me;
                    FB.api( '/me', 'get', {}, function ( response ) {
                        me = response;
                        console.log(response);
                        //Make the first request
                        FB.api( '/me/feed', 'get', params, function ( response ) {
                            // /posts originally, but I think this api no longer works
                            document.processingNotification = new PNotify( {
                                title: 'Parsing',
                                text: 'Please wait while we process your request...',
                                type: 'warning',
                                hide: false
                            } );

                            var allPosts = response.data;

                            if ( response.data && response.data.length ) {
                                var allComments = {
                                    "comments": []
                                };

                                // response.data.forEach( function ( post ) {
                                //     comments = _.merge( comments || [], _.map( post.comments.data, 'message' ) );
                                // } );

                                // get detail comments
                                async.each( allPosts, function ( post, callback ) {
                                        if ( !post.id ) {
                                            return callback();
                                        }

                                        FB.api( '/' + post.id + '/comments', 'get', {}, function ( res ) {
                                            res.data.forEach( function ( comment ) {
                                                if ( !comment.from || !comment.from.id ) {
                                                    return;
                                                }
                                                // if ( comment.from.id == me.id ) {
                                                //     return;
                                                // }

                                                allComments.comments.push( comment.message );
                                            } );
                                            post.comments = res.data;
                                            callback();
                                        } );
                                    },
                                    function () {
                                        $.ajax( 'http://cs410.i3dataconsulting.com/api/nlp/assess', {
                                                method: 'post',
                                                data: {comments: allComments.comments},
                                                beforeSend: function ( xhr ) {
                                                    xhr.setRequestHeader( 'x-key', '1234567890' );
                                                }
                                            } )
                                            .done( function ( data ) {
                                                $( '#results-total-comments' )
                                                    .html( data.total );
                                                $( '#results-total-bullying' )
                                                    .html( data.totalBullying );

                                                _.each( data.results, function ( result ) {
                                                    var bullying = 'N';

                                                    if ( result.isBully ) {
                                                        bullying = 'Y';
                                                    }

                                                    var bProbability = null;

                                                    _.each(result.classifications, function(r){
                                                        if(r.label === "bullying"){
                                                            bProbability = r.value;
                                                        }
                                                    })

                                                    var entry = $('<tr><td>' + result.comment + '</td>' +
                                                            '<td>' + bullying + '</td>' +
                                                            '<td>' + bProbability + '</td>' +

                                                            '</tr>');
                                                    var classifyControl = $('<td><a href="#" class="yes">Yes</a> <a href="#" class="no">No</a></td>');
                                                    function classifyCb () {
                                                        new PNotify( {
                                                            title: 'Success',
                                                            text: 'Thanks for your input.',
                                                            type: 'success'
                                                        } );
                                                    }
                                                    classifyControl.find('.yes').click(function () {
                                                        $.ajax( 'http://cs410.i3dataconsulting.com/api/nlp/classify', {
                                                            method: 'put',
                                                            data: {comment: result.comment, isBully: true},
                                                            beforeSend: function ( xhr ) {
                                                                xhr.setRequestHeader( 'x-key', '1234567890' );
                                                            }
                                                        } )
                                                        .done(classifyCb);
                                                    });
                                                    classifyControl.find('.no').click(function () {
                                                        $.ajax( 'http://cs410.i3dataconsulting.com/api/nlp/classify', {
                                                            method: 'put',
                                                            data: {comment: result.comment, isBully: false},
                                                            beforeSend: function ( xhr ) {
                                                                xhr.setRequestHeader( 'x-key', '1234567890' );
                                                            }
                                                        } )
                                                        .done(classifyCb);
                                                    });
                                                    entry.append(classifyControl);
                                                    $( '#results-tbody' )
                                                        .append( entry );
                                                } );

                                                PNotify.removeAll();

                                                $( '#results-container' )
                                                    .show();
                                            } );
                                    } );

                            } else {
                                console.log( 'empty response', response );

                            }
                        } );
                    } );
                } );
        } );

        /**
         * Helper functions
         */
        function enableSearchBar() {
            $( '#fbaccount' )
                .attr( 'disabled', false );
        }

        function searchFBAccounts( searchString, cb ) {
            if ( searchString && searchString.length > 2 ) {
                FB.api( '/search/', {
                    type: 'user',
                    limit: 30,
                    fields: 'id,name,picture,link',
                    q: searchString
                }, function ( response ) {
                    if ( _.has( response, 'error' ) ) {
                        new PNotify( {
                            title: 'Error',
                            text: 'Cannot search Facebook using that query',
                            type: 'error'
                        } );
                        return [];
                    }

                    var cleanResponses = [];

                    _.each( response.data, function ( r ) {
                        // cleanResponses.push({id: r, text: r.name + ', ' + location + ' - ' + r.link})
                        cleanResponses.push( {
                            image: r.picture.data.url,
                            name: r.name,
                            id: r.id
                        } )
                    } );

                    cb( cleanResponses );
                } );
            } else {
                return cb( [] );
            }
        }
    } );
