"use strict";
/**
 * NlpController
 *
 * @description :: Server-side logic for managing nlps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
let async = require( 'async' );

module.exports = {
    save: (req, res)=>{
        console.log(req.body);
        // console.log(JSON.parse(req.body));

        let comments = _.get(req, 'body.comments');
        let post = _.get(req, 'body.post');

    },
    assess: function ( req, res ) {
        /**
         * We are expecting an array of documents. Make sure they have passed that
         */
        let comments = _.get( req, 'body.comments', false );

        //Make sure they passed actual data
        if ( comments && _.isArray( comments ) && comments.length ) {
            WatsonService.analyze( comments, ( err, results ) => {
                return res.jsonx( results );
            } )
        } else {
            return res.serverError( 'No comments passed.' );
        }
    },

    // classifyPosts: function ( req, res ) {
    //     if ( !req.body.post || !_.has( req.body, 'isBully' ) ) {
    //         return res.serverError( 'Body has to have properties post and isBully' );
    //     }
    //
    //     // read from disk
    //     Natural.BayesClassifier.load( process.cwd() + '/scripts/data/emotionClassifier.json', null, ( err, classifier ) => {
    //         if ( err ) {
    //             return res.serverError( err );
    //         }
    //
    //         if ( req.body.isBully ) {
    //             classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( req.body.post.replace( /[^a-zA-Z0-9 -]/, '' ) ), 'bullying' );
    //         } else {
    //             classifier.addDocument( Natural.PorterStemmer.tokenizeAndStem( req.body.post.replace( /[^a-zA-Z0-9 -]/, '' ) ), 'non-bullying' );
    //         }
    //
    //         // persist to disk
    //         classifier.save( process.cwd() + '/scripts/data/postClassifier.json', function ( err ) {
    //             if ( err ) {
    //                 return res.serverError( err );
    //             } else {
    //                 return res.ok( 'ok' );
    //             }
    //         } );
    //     } );
    // }
};
