/**
 * This file initializes the classification file.
 */

// Bring in libraries
let Natural = require( 'natural' );
let _ = require( 'lodash' );
let fs = require( 'fs' );
let byLine = require( 'byline' );

// Init our classifier for later use.
let Classifier = new Natural.BayesClassifier();

// Use the PorterStemmer and set to attach mode.
Natural.PorterStemmer.attach();

// Words for emotions
let data = new Map();

// Create a read stream from the training data file.
let rs = byLine( fs.createReadStream( 'data/emotion-index.txt', 'utf8' ) );

// Concat it all together
rs.on( 'data', function ( line ) {
    let lineArray = line.split( '\t' );

    if ( lineArray[ 2 ] == "1" ) {
        let tokenWord = Natural.PorterStemmer.tokenizeAndStem( lineArray[ 0 ] )[ 0 ];

        if ( data.has( tokenWord ) ) {
            let currentVal = data.get( tokenWord );

            //Only set it if it's not already there.
            if ( currentVal.indexOf( lineArray[ 1 ] ) === -1 ) {
                currentVal.push( lineArray[ 1 ] );
                data.set( tokenWord, currentVal );
            }
        } else {
            data.set( tokenWord, [ lineArray[ 1 ] ] );
        }
    }
} );

// When we h ave all the contents.
rs.on( 'end', () => {
    data.forEach( ( emotions, word ) => {
        emotions.forEach( ( emotion ) => {
            console.log( 'classifying', word, 'as', emotion );
            Classifier.addDocument( word, emotion );
        } )
    } )

    // Start the classifier training...
    Classifier.train();
    // Save it so we can use it when requests come in from the FE.
    Classifier.save( 'data/emotionClassifier.json', function ( err, classifier ) {
        if ( err ) {
            process.exit( err );
        } else {
            process.exit( 'Classifier successfully ran and saved the output to emotionClassifier.json' );
        }
    } );
} );
// End of the one-time script
