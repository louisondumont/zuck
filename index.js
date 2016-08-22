var config = require('./config.js'),
    utils = require('utils');

/*!
 * globals
 */

var _dyn= '';
var cookies = '';

/*!
 * Main Casper
 * Logs into Facebook and stays there forever, listening for new messages
 */


var casper = require('casper').create({
  verbose:true,
  logLevel:"debug",
  pageSettings: {
    loadImages: false,
    loadPlugins: false,
    captureContent: [ /.*/ ], // should be optimized
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
    }
});
// Open Facebook
casper.start().thenOpen("https://facebook.com", function() {
    console.dir("Facebook website opened");
});
casper.page.captureContent = [/application.*/]
// Populate username and password, and submit the form
casper.then(function(){
  console.log("Login using username and password");
  this.evaluate(function(email, pass){
    document.getElementById("email").value=email;
    document.getElementById("pass").value=pass;
    document.getElementById("loginbutton").children[0].click();
  }, config.email, config.pass);
});

// Wait forever
casper.then(function(){
  //console.log('COOKIES');
  //console.log(phantom.cookies)
  console.log('Now listening.');

  // Wait at this stage 10k days. Should find "forever" function.
  this.wait(864000000000);
});

/*!
 * Spy Casper
 * Send message to myself every day to extract from "UI requested" msg send request dynamic variables and use them in our manually generated send_msg queries
 */

var casperSpy = require('casper').create({
  verbose:true, logLevel:"debug",
  pageSettings: {
    loadImages: false,
    loadPlugins: false,
    captureContent: [ /.*/ ],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
  }
});

// Init, could probably be sexier
casperSpy.start().thenOpen("https://www.google.com", function() {
  this.wait(10000)
});

// Send msg loop. will check how to do it better later
var numTimes = 10000, count = 1;

casperSpy.repeat(numTimes, function() {

  // loop
  this.thenEvaluate(function(count) {
    nextPage(count);
  }, ++count);

  // open "message myself" page
  this.thenOpen("https://www.facebook.com/messages/" + config.userId, function() {

    console.log("Message myself");

    // actually message myself
    this.evaluate(function(){
      document.getElementsByName("message_body")[0].value="test";
      document.getElementsByClassName("uiButtonConfirm")[0].children[0].click();
    });
  });

  // stop until tomorrow
  this.then(function() {
    this.wait(86400000); // erry day
  });
});

casperSpy.run();

// listen to send message request
casperSpy.options.onResourceRequested = function(C, requestData, request) {

  if(requestData.url.indexOf('send') > 0)  {

    // update globals
    cookies = requestData.headers[9].value;
    _dyn = requestData.postData.substring(requestData.postData.indexOf('&__dyn='))
  }
};

function send(msg, to, casp) {

  // dirty too, we could inject the function client side instead.
  casp.evaluate(function(_dyn, uid, msg, to) {
    var dyn = _dyn;
    function send(msg, to) {
      var timestamp = Date.now();
      var messageId = Math.floor(1000000000000000000 + Math.random() * 7000000000000000000); // they seem to not like big numbers

      var dataString = 'client=mercury&action_type=ma-type%3Auser-generated-message&body=' + msg + '&ephemeral_ttl_mode=0&has_attachment=false&message_id=' + messageId + '&offline_threading_id=' + messageId + '&other_user_fbid=' + to + '&source=source%3Amessenger%3Aweb&specific_to_list[0]=fbid%3A' + to + '&specific_to_list[1]=fbid%3A' + uid + '&timestamp=' + timestamp + '&__user=' + uid + '&__a=1' + dyn + '&__req=h&__be=-1&__pc=PHASED%3Amessengerdotcom_pkg';
      var url = "https://www.facebook.com/messaging/send/?dpr=1";

      var http = new XMLHttpRequest();
      var params = dataString;
      http.open("POST", url, true);
      http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      http.send(params);
    }
    send(msg, to);
  }, _dyn, config.userId, msg, to);
}

// Listen to incoming messages
casper.options.onResourceReceived = function(C, response) {
  if(response.url.indexOf('facebook.com/pull?channel=') > 0) {
  utils.dump(response.body);
    if(response.body.indexOf('for (;;);') >= 0) {
      var obj = JSON.parse(response.body.substring(10));
      if(obj.t === 'msg' && obj.ms && obj.ms[0] && obj.ms[0].delta && obj.ms[0].delta.body) {
        var body = obj.ms[0].delta.body;
        var author = obj.ms[0].delta.messageMetadata.actorFbId;
        console.log('Received "' + body + '" from ' + author);

        // send answer
        if(author !== config.userId)  send(answer(body), author, this);
        // messages I send in a conv to someone are sent from... me. In this case, reply not to me, but to my friend, if I mentionned @majordome only.
        else {
          if(body.toLowerCase().indexOf('@majordome') !== -1) {
            send(answer(body), obj.ms[0].delta.messageMetadata.threadKey.otherUserFbId, this);
          }
        }
      }
    }
  }
};

casper.run();

// this is where you plug your AI or whatever
function answer(q) {
  q = q.toLowerCase();
  var answer = '';
  if(q === 'hi' || q === 'hello' || q === 'yo' || q === 'hey' || q === 'salut' || q === 'bonjour')
    answer += "Hi."
  if(q === ':)')
    answer += ':D'
  if(q === '❤' || q === '<3' || q === '@peter ❤️')
    answer += '<3'
  if(q.indexOf('how are you') !== -1)
    answer += "I'm doing great. ";
  if(q.indexOf('love you') !== -1)
    answer += "Me too, so much.";
  if(q.indexOf('good night') !== -1)
    answer += "Sweet dreams. ";
  if(q.indexOf('buy bitcoin') !== -1) {
    answer += "Use Coinbase. :)";
  }
  if(answer === '')
    answer += "I can't reply to that. Wait until my creator comes back. - Zuck";
  return answer;
}
