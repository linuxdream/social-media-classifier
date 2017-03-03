let ToneAnalyzer = require( 'watson-developer-cloud/tone-analyzer/v3' );
let async = require( 'async' );

let toneAnalyzer = new ToneAnalyzer( {
    "url": "https://gateway.watsonplatform.net/tone-analyzer/api",
    "username": process.env.WATSON_TONE_USERNAME,
    "password": process.env.WATSON_TONE_PASSWORD,
    "version_date": "2016-05-19"
} );

module.exports = {
    analyze: ( text, cb ) => {
        if ( !text || !Array.isArray( text ) ) {
            return false;
        }

        let asyncArray = [];

        text.forEach( ( t ) => {
            asyncArray.push( function ( cb ) {
                toneAnalyzer.tone( {
                    'text': t
                }, ( err, analysis ) => {
                    if ( err ) {
                        cb( err );
                    } else {
                        cb( null, {
                            'text': t,
                            'analysis': analysis
                        } );
                    }
                } );
            } );
        } );

        async.series( asyncArray, ( err, results ) => {
            if ( err ) {
                return cb( err );
            }

            return cb( null, results );
        } )

    }
}
