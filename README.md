# What is it?
Zuck is a wrapper for Facebook Messenger. It can be used to build a bot on top of Facebook Messenger for a personal account. 

Code is not pretty, and so is this "documentation" (? ;-) ), I made this hack for my own needs and would be very happy to maintain it and make it cleaner if I see a raising interest.

# How does it work?
Facebook doesn't provide an API for Messenger and reverse engineering the whole thing constantly would be so annoying for me. This is dirty but it works and it's all I need atm. Zuck uses a headless browser to log into your Fb account, then listen and reply to your messages using the function you defined.

# Requirements
Tested on Ubuntu 14.04
- `sudo npm install -g casperjs slimerjs`
- `sudo apt-get install xvfb firefox`
- `Xvfb :99 &`
- `export DISPLAY=:99`

# Get started
Make sure to read the requirements before starting.

- `git clone https://github.com/louisondumont/zuck`
- edit config.sample.js
- `mv config.sample.js config.js`
- `sudo casperjs index.js --engine=slimerjs`

# Customize
You'll find everything you need in index.js, you can customize the `answer` function.


