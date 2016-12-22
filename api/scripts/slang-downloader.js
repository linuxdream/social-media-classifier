//Libs
let _ = require('lodash');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');
let async = require('async');

//Main vars
let range = [1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
let url = 'http://www.noslang.com/dictionary/';

/**
 * We want the bad words to be included
 */
let badWords = {
    "f**k": "fuck",
    "s**t": "shit",
    "b***h": "bitch",
    "a**h**e": "asshole",
    "a**": "ass",
    "c**k": "cock",
    "d**n": "damn",
    "p***y": "pussy",
    "f*g": "fag",
    "b*****d": "bastard",
    "d**k": "dick"
};

//Create the write stream
let ws = fs.createWriteStream('data/slang.json');
let finalBadWords = [];
let currentUrl = "";
let asyncCalls = [];

_.each(range, (letter)=>{
    asyncCalls.push(function(cb){
        currentUrl = url + letter.toString();
        console.log('Requesting', currentUrl);
        request(currentUrl, (err, response, html) => {
            if(err){
                cb(err);
            }

            let $ = cheerio.load(html);
            let returnResults = [];

            _.each($('.dictonary-word'), (elm)=> {
                let s = $(elm).find('dt').text();
                let slang = s.substring(0, s.length - 2);

                let words = $(elm).find('dd').text();

                /**
                 * Check for substitutions
                 */
                _.each(badWords, (v, k)=>{
                    words = words.replace(k, v);
                });

                let wordObj = {};
                wordObj.slang = slang;
                wordObj.words = words;
                returnResults.push(wordObj);
            });

            console.log('Complete');
            cb(null, returnResults);
        });
    });
});

async.series(asyncCalls, (err, results)=>{
    if(err){
        process.exit(err);
    }

    results.forEach((result)=>{
        _.each(result, (wordsObj)=>{
            finalBadWords.push(wordsObj);
        })
    });

    ws.write(JSON.stringify(finalBadWords));
    ws.close();
});
