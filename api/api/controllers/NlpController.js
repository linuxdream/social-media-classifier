"use strict";
/**
 * NlpController
 *
 * @description :: Server-side logic for managing nlps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
let async = require( 'async' );
let Natural = require( 'natural' );
let tokenizer = new Natural.WordTokenizer();

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
            let fs = require('fs');

            fs.readFile( process.cwd() + '/scripts/data/emotionwords.json', null, ( err, words ) => {
                if ( err ) {
                    return res.serverError( err );
                }

                let wordsMap = UtilsService.objToStrMap(JSON.parse(words));

                //Loop through the posts
                async.each( posts, function ( post, callback ) {
                    if(post.length){
                        let wordsArray = tokenizer.tokenize(post);
                        let postMetrics = {
                            'post': post,
                            'analysis': new Map()
                        };

                        //Cycle through each word in the post
                        wordsArray.forEach((word)=>{
                            //Check if that word is present in the wordsMap
                            if(wordsMap.has(word)){
                                //If it is, then increment each attribute for that word
                                let attrs = wordsMap.get(word);

                                attrs.forEach((attr)=>{
                                    if(postMetrics.analysis.has(attr)){
                                        let newVal = postMetrics.analysis.get(attr) + 1;

                                        //Increment the value
                                        postMetrics.analysis.set(attr, newVal);
                                    }else{
                                        //Initialize it at one
                                        postMetrics.analysis.set(attr, 1);
                                    }
                                })
                            }
                        });

                        postMetrics.analysis.forEach((v, k)=>{
                            let weight = v / wordsArray.length;
                            postMetrics.analysis.set(k, weight);
                        });

                        postMetrics.analysis = UtilsService.strMapToObj(postMetrics.analysis);

                        //Increment counter
                        postResults.total++;
                        postResults.results.push(postMetrics);
                    }
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
