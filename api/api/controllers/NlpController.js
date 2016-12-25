"use strict";
/**
 * NlpController
 *
 * @description :: Server-side logic for managing nlps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
let async = require( 'async' );
let Natural = require( 'natural' );

module.exports = {
    assess: function ( req, res ) {
        /**
         * We are expecting an array of documents. Make sure they have passed that
         */
        let comments = _.get( req, 'body.comments', false );

        //Make sure they passed actual data
        if ( comments && _.isArray( comments ) && comments.length ) {
            //Prep the stemmer
            Natural.PorterStemmer.attach();

            //Setup the results
            let commentResults = {
                total: 0,
                totalBullying: 0,
                results: []
            };

            //Temp token holder
            let tmpToken = [];

            Natural.BayesClassifier.load( process.cwd() + '/scripts/data/classifier.json', null, ( err, classifier ) => {
                if ( err ) {
                    return res.serverError( err );
                }

                let tokenizedComment = [];

                //Loop through the comments
                async.each( comments, function ( comment, callback ) {
                    tokenizedComment = Natural.PorterStemmer.tokenizeAndStem( comment.replace( /[^a-zA-Z0-9 -]/, '' ) );

                    let res = false;
                    if ( classifier.classify( tokenizedComment ) === 'bullying' ) {
                        res = true;
                        //Add to bullying count
                        commentResults.totalBullying++;
                    }

                    //Increment counter
                    commentResults.total++;

                    let classifications = classifier.getClassifications( tokenizedComment );
                    commentResults.results.push( {
                        comment: comment,
                        isBully: res,
                        classifications: classifications
                    } );
                    callback();
                }, function ( err ) {
                    if ( err ) {
                        return res.serverError( err );
                    }

                    return res.jsonx( commentResults );
                } );
            } );
        } else {
            return res.serverError( 'No comments passed.' );
        }
    },

    classify: function ( req, res ) {
        if ( !req.body.comment || !_.has( req.body, 'isBully' ) ) {
            return res.serverError( 'Body has to have properties comment and isBully' );
        }

        // read from disk
        Natural.BayesClassifier.load( process.cwd() + '/scripts/data/classifier.json', null, ( err, classifier ) => {
            if ( err ) {
                return res.serverError( err );
            }

            if ( req.body.isBully ) {
                classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( req.body.comment.replace( /[^a-zA-Z0-9 -]/, '' ) ), 'bullying' );
            } else {
                classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( req.body.comment.replace( /[^a-zA-Z0-9 -]/, '' ) ), 'non-bullying' );
            }

            // persist to disk
            classifier.save( process.cwd() + '/scripts/data/classifier.json', function ( err ) {
                if ( err ) {
                    return res.serverError( err );
                } else {
                    return res.ok( 'ok' );
                }
            } );
        } );
    }
};
