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
    assessPosts: function ( req, res ) {
        /**
         * We are expecting an array of documents. Make sure they have passed that
         */
        let posts = _.get( req, 'body.posts', false );

        //Make sure they passed actual data
        if ( posts && _.isArray( posts ) && posts.length ) {
            //Prep the stemmer
            Natural.PorterStemmer.attach();

            //Setup the results
            let postResults = {
                total: 0,
                results: []
            };

            //Temp token holder
            let tmpToken = [];

            Natural.BayesClassifier.load( process.cwd() + '/scripts/data/postClassifier.json', null, ( err, classifier ) => {
                if ( err ) {
                    return res.serverError( err );
                }

                let tokenizedPost = [];

                //Loop through the posts
                async.each( posts, function ( post, callback ) {
                    tokenizedPost = Natural.PorterStemmer.tokenizeAndStem( post.replace( /[^a-zA-Z0-9 -]/, '' ) );

                    //Increment counter
                    postResults.total++;
                    let group = classifier.classify( tokenizedPost );
                    console.log( group );
                    let classifications = classifier.getClassifications( tokenizedPost );

                    postResults.results.push( {
                        post: post,
                        group: group,
                        classifications: classifications
                    } );
                    callback();
                }, function ( err ) {
                    if ( err ) {
                        return res.serverError( err );
                    }

                    return res.jsonx( postResults );
                } );
            } );
        } else {
            return res.serverError( 'No posts passed.' );
        }
    },

    classifyPosts: function ( req, res ) {
        if ( !req.body.post || !_.has( req.body, 'isBully' ) ) {
            return res.serverError( 'Body has to have properties post and isBully' );
        }

        // read from disk
        Natural.BayesClassifier.load( process.cwd() + '/scripts/data/postClassifier.json', null, ( err, classifier ) => {
            if ( err ) {
                return res.serverError( err );
            }

            if ( req.body.isBully ) {
                classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( req.body.post.replace( /[^a-zA-Z0-9 -]/, '' ) ), 'bullying' );
            } else {
                classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( req.body.post.replace( /[^a-zA-Z0-9 -]/, '' ) ), 'non-bullying' );
            }

            // persist to disk
            classifier.save( process.cwd() + '/scripts/data/postClassifier.json', function ( err ) {
                if ( err ) {
                    return res.serverError( err );
                } else {
                    return res.ok( 'ok' );
                }
            } );
        } );
    }
};
