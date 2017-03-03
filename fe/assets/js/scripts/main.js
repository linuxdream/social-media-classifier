$( document )
    .ready( function () {
        //Setup caching
        $.ajaxSetup( {
            cache: true
        } );

        var apiURL = 'http://localhost:1337';

        /**
         * Grab the Facebook SDK and attempt to login/auth. We need them logged in
         * so that we can search FB as their account and access profiles that might
         * otherwise be private but not to the current user.
         */
        $.getScript( 'https://connect.facebook.net/en_US/sdk.js', function () {
            FB.init( {
                //App ID for this project
                appId: '337139396668508',
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
                        scope: [ 'email' ]
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
                        'description',
                        // 'from',
                        // 'link',
                        'message',
                        // 'name',
                        'story',
                        // 'to',
                        // 'type',
                        'comments.summary(1)',
                        // 'likes.summary(1)'
                    ];
                    var params = {
                        since: moment( moment()
                                .subtract( 3, 'months' ), 'YYYY-MM-DD hh:mm A' )
                            .unix(),
                        until: moment( moment(), 'YYYY-MM-DD hh:mm A' )
                            .unix(),
                        limit: 500,
                        fields: requestFields.join( ',' )
                    };

                    FB.api( '/' + fbid + '/feed', 'get', {}, function ( response ) {
                        document.processingNotification = new PNotify( {
                            title: 'Parsing',
                            text: 'Please wait while we process your request...',
                            type: 'warning',
                            hide: false
                        } );

                        var allPosts = response.data;
                        console.log( response );
                        if ( response.data && response.data.length ) {
                            var allComments = {
                                "comments": []
                            };

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

                                            allComments.comments.push( comment.message );
                                        } );
                                        post.comments = res.data;
                                        callback();
                                    } );
                                },
                                function () {
                                    $.ajax( apiURL + '/nlp/assess', {
                                            method: 'put',
                                            data: {
                                                comments: allComments.comments
                                            },
                                            beforeSend: function ( xhr ) {
                                                // xhr.setRequestHeader( 'x-key', '1234567890' );
                                            }
                                        } )
                                        .done( function ( data ) {

                                            $( '#results-total-comments' )
                                                .html( data.length );

                                            _.each( data, function ( result ) {
                                                var emotionTones = _.get( result, 'analysis.document_tone.tone_categories[0]' );
                                                var languageTones = _.get( result, 'analysis.document_tone.tone_categories[1]' );
                                                var socialTones = _.get( result, 'analysis.document_tone.tone_categories[2]' );

                                                var emotionResults = [];
                                                emotionTones.tones.forEach( function ( tone ) {
                                                    emotionResults.push( tone.tone_name + ': ' + tone.score );
                                                } );

                                                var languageResults = [];
                                                languageTones.tones.forEach( function ( tone ) {
                                                    languageResults.push( tone.tone_name + ': ' + tone.score );
                                                } );

                                                var socialResults = [];
                                                socialTones.tones.forEach( function ( tone ) {
                                                    socialResults.push( tone.tone_name + ': ' + tone.score );
                                                } );

                                                var entry = $( '<tr><td>' + result.text + '</td>' +
                                                    '<td>' + emotionResults.join( '<br/>' ) + '</td>' +
                                                    '<td>' + languageResults.join( '<br/>' ) + '</td>' +
                                                    '<td>' + socialResults.join( '<br/>' ) + '</td>' +
                                                    '</tr>' );

                                                $( '#results-tbody' )
                                                    .append( entry );
                                            } );

                                            PNotify.removeAll();

                                            $( '#results-container' )
                                                .show();
                                        } );
                                } );
                        } else {
                            console.log( 'no data' );
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
            type: 'page',
            limit: 5,
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
