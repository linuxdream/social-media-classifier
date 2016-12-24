/**
 * This file initializes the classification file.
 */

// Bring in libraries
let Natural = require( 'natural' );
let _ = require( 'lodash' );
let fs = require( 'fs' );

// Init our classifier for later use.
let Classifier = new Natural.BayesClassifier();

// Use the PorterStemmer and set to attach mode.
Natural.PorterStemmer.attach();

// Data buffer
let data = '';

// Create a read stream from the training data XML file. It's big...11MB
let rs = fs.createReadStream( 'data/training_portland_coding.json', 'utf8' );

// Concat it all together
rs.on( 'data', function ( chunk ) {
    data += chunk;
} );

// When we h ave all the contents.
rs.on( 'end', function () {
    let trainingPortland = JSON.parse( data );

    // Start the classifier training...
    Classifier.train();

    // Let's replace slang words with their real meaning.
    fs.readFile( 'data/slang.json', 'utf8', ( err, slang ) => {
        if ( err ) {
            process.exit( err );
        }

        // The slang to normal text array of objects
        let slangArray = JSON.parse( slang );
        let bullyCounter = 0;

        // Loop through the FORMSPRINGID array.
        trainingPortland.forEach( function ( data ) {
            let message = data.post.replace( /[^a-zA-Z0-9 -]/, '' )
                .replace( /\\r\\n/, '' );
            let slangPattern = null;

            _.each( slangArray, ( s ) => {
                slangPattern = new RegExp( '/\w?' + s.slang.replace( '*', '\\*' )
                    .replace( '?', '\\?' )
                    .replace( '/', '\\/' )
                    .replace( '|', '\\|' ) + '\w?/' );
                if ( s.slang.length && message.search( slangPattern ) != -1 ) {
                    message.replace( s.slang, s.words );
                }
            } );

            Classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( message ), data.code );
        } );

        // Save it so we can use it when requests come in from the FE.
        Classifier.save( 'data/classifier.json', function ( err, classifier ) {
            if ( err ) {
                process.exit( err );
            } else {
                process.exit( 'Classifier successfully ran and saved the output to classifier.json' );
            }
        } );
    } );
} );
// End of the one-time script
