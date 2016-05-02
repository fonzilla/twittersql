'use strict';
var express = require('express');
var router = express.Router();

module.exports = function makeRouterWithSockets (io, client) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
   client.query('SELECT * FROM tweets JOIN users ON tweets.userid = users.id', function (err, result) {
    var tweets = result.rows;
    //console.log(tweets);
    res.render('index', { title: 'Twitter.js', tweets: tweets });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var name = req.params.username;
    client.query('SELECT * FROM tweets JOIN users ON tweets.userid = users.id WHERE name=$1',[name], function (err, result) {
      var tweets = result.rows;
      //console.log(tweets);
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweets,
          showForm: true,
          username: req.params.username
        });
      // res.render('index', { title: 'Twitter.js', tweets: tweets });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var id = req.params.id;
    client.query('SELECT * FROM tweets JOIN users ON tweets.userid = users.id WHERE tweets.id=$1',[id], function (err, result) {
      var tweets = result.rows;
      //console.log(tweets);
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets // an array of only one element ;-)
      });
    });
  });
  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var name = req.body.name;
    var text = req.body.text;
    var hashtags = text.match(/\S*#\S+/gi);
    var tweet_id = client.query('SELECT id FROM tweets', function(err,result){
      var arr = result.rows;
      var lastID = arr.length+1;
      return lastID;
      //console.log(arr, lastID);
    })
    var user_id = client.query('SELECT id FROM users WHERE name=$1',[name],function (err,result){
      //console.log(result);
      return result.rows[0].id;
    });
    
    // console.log(tweet_id, 'HELLO HELLO HELLO');

    client.query('INSERT INTO tweets (userId,content) VALUES ($1, $2)',[user_id, text],function(err,result){

    });
          
    if(hashtags.length){
      hashtags.forEach(function(hash){
        client.query('INSERT INTO hashtags (tag) VALUES ($1)', [hash],function(err,result){
        });
        var tag_id = client.query('SELECT id FROM hashtags WHERE tag=$1', [hash], function(err,result){
          return result.rows[0].id;
        });
        client.query('INSERT INTO tag_tweet (tagid,tweetid) VALUES ($1, $2)', [tag_id,tweet_id], function(err,result){
        });
      });
    };

    res.redirect('/');
});

// CREATE TABLE tag_tweet (
// id SERIAL PRIMARY KEY,
// tagid INTEGER REFERENCES  hashtags(id) NOT NULL,
// tweetid INTEGER REFERENCES tweets(id) NOT NULL
// );

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
