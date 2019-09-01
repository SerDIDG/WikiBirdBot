const cm = require('./common.js');
const request = require('request-promise');
const fs = require('fs');
const nodemw = require('nodemw');
const snl = require('simple-node-logger');
const ora = require('ora');
const schedule = require('node-schedule');

/******* CONFIG *******/

const { version } = require('./package.json');
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36';
const url = 'https://petscan.wmflabs.org/';
const params = require('./music.new.petscan.json');
const attempts = 15;
const dataPath = './data/music.new.json';
const wikiPath = './data/music.new.txt';
const botConfig = fs.existsSync('./config.json') ? './config.json' : './config.example.json';
const outputWiki = 'Проект:Музыка/Новые статьи';
const outputLimit = 75;

/*** INSTANCES ***/

const log = snl.createSimpleLogger('./logs/music.new.log');
const bot = new nodemw(botConfig);

/*** VARIABLES ***/

let data = require(dataPath);
let dataLength = data.length;
let botIsLogged = false;
let attempt = 0;
let current = 0;

/*** HELPERS ***/

function callSpinner(){
    const date = Date.now();
    const spinner = new ora();
    setTimeout(() => {
        spinner.textInterval = setInterval(() => {
            let now = Date.now();
            let passed = ((now - date) / 1000).toFixed(0);
            spinner.text = 'Passed: ' + passed + 's';
        }, 1000 * 15);
        spinner.start('Requesting...');
    },5);
    return spinner;
}

function stopSpinner(spinner){
    spinner.stop();
    clearInterval(spinner.textInterval);
}

function callBot(success, error){
    if(!botIsLogged){
        loginBot(success, error);
    }else{
        success && success();
    }
}

function loginBot(success, error){
    bot.logIn((err) => {
        if(err){
            botIsLogged = false;
            log.fatal('Bot login failed: ', err);
            error && error(err);
        }else{
            botIsLogged = true;
            log.info('Bot login success');
            success && success();
        }
    });
}

function logTime(past, category){
    let now = Date.now();
    let passed = ((now - past) / 1000).toFixed(0);
    log.info('Time passed (', category, '): ', passed, 's');
}

function writeDataResults(){
    let json = JSON.stringify(data, null, 2);
    fs.writeFileSync(dataPath, json);
}

/******* ACTIONS *******/

/*** PETSCAN ***/

function requestAttempt(success, error){
    const now = Date.now();
    attempt = 0;
    log.info('======= Request articles  =======');
    requestAttemptHelper(() => {
        logTime(now, 'attempts');
        success && success();
    }, () => {
        logTime(now, 'attempts');
        error && error();
    });
}

function requestAttemptHelper(success, error){
    attempt++;
    if(attempt <= attempts){
        requestArticles(success, error);
    }else{
        log.fatal('Attempts failed');
        error && error();
    }
}

function requestArticles(success, error){
    log.info('=== Request attempt: ', attempt, ' ===');
    const spinner = callSpinner();
    // Request
    let status;
    let options = {
        headers: {
            'User-Agent': userAgent,
            'content-type' : 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        uri: url,
        body: cm.obj2URI(params),
        json: true
    };
    request(options)
        .then((response) => {
            stopSpinner(spinner);
            try{
                data = response['*'][0]['a']['*'];
                dataLength = data.length;
                if(dataLength > 0){
                    status = 'success';
                    log.info('Success! Query time:  ', response.a.querytime_sec, ' / Count: ', dataLength);
                }else{
                    status = 'empty';
                    log.fatal('Data is empty');
                }
            }catch(e){
                data = response;
                dataLength = data.length;
                status = 'bad_format';
                log.fatal('Unknown response format');
            }
            writeDataResults();
        })
        .catch((err) => {
            stopSpinner(spinner);
            status = err.statusCode || err;
            log.error(status);
            log.error(JSON.stringify(err));
        })
        .finally(() => {
            switch(status){
                case 'success':
                    success && success(status);
                    break;
                case 'bad_format':
                    error && error(status);
                    break;
                case 'empty':
                default:
                    requestAttemptHelper(success, error);
                    break;
            }
        });
}

/*** REVISIONS ***/

function requestArticlesData(callback){
    const now = Date.now();
    current = -1;
    log.info('======= Request articles revisions =======');
    requestArticlesDataHelper(() => {
        logTime(now, 'articles data');
        callback && callback();
    });
}

function requestArticlesDataHelper(callback){
    // New iteration
    current++;
    if(current < dataLength){
        let item = data[current];
        requestArticleData(item, () => {
            requestArticlesDataHelper(callback);
        });
    }else{
        callback && callback();
    }
}

function requestArticleData(item, callback){
    const now = Date.now();
    log.info('=== Request article: ', item.title, ' ===');
    // Prepare
    item.i = current;
    // Request
    callBot(() => {
        bot.getArticleRevisions(item.title, (err, response) => {
            if(err){
                item.error = true;
                item.errorMessage = err;
                log.error(err);
            }else{
                item.error = false;
                item = cm.merge(item, response[0]);
                data[item.i] = item;
                log.info('Success! Revision id: ' + item.revid);
            }
            writeDataResults();
            logTime(now, 'article');
            callback && callback();
        });
    }, () => {
        logTime(now, 'article');
        callback && callback();
    });
}

/*** WIKI ***/

function editOutputArticle(callback){
    const now = Date.now();
    log.info('======= Edit output article =======');
    // Convert
    if(dataLength > 0){
        json2wiki((wikitext) => {
            saveOutputArticle(wikitext, () => {
                logTime(now, 'article data');
                callback && callback();
            });
        });
    }else{
        log.error('Nothing to output, data is empty');
        logTime(now, 'article data');
        callback && callback();
    }
}

function json2wiki(callback){
    const now = Date.now();
    log.info('=== JSON 2 WIKI  ===');
    // Prepare
    const dataLimit = (outputLimit && dataLength > outputLimit) ? data.slice(0, outputLimit) : data;
    const dataWiki = [];
    dataLimit.forEach((item) => {
        if(!item.error){
            let title = item.title
                .replace(/=/g, '{{=}}')
                .replace(/\|/g, '{{!}}')
                .replace(/_/g, ' ');
            let row = ['* {{Новая статья', title, item.timestamp, item.user, 'size=1}}'].join('|');
            dataWiki.push(row);
        }
    });
    // Write
    const wikiCat = '<noinclude>[[Категория:Википедия:Списки новых статей по темам|{{PAGENAME}}]]</noinclude>';
    const wikiText = dataWiki.join('\n') + wikiCat;
    fs.writeFileSync(wikiPath, wikiText);
    logTime(now, 'json 2 wiki');
    callback && callback(wikiText);
}

function saveOutputArticle(wikitext, callback){
    const now = Date.now();
    log.info('=== Save output article ===');
    // Edit
    callBot(() => {
        let summary = 'Обновление данных (v.' + version + ')';
        bot.edit(outputWiki, wikitext, summary, true, function(err){
            if(err){
                log.fatal(err);
            }else{
                log.info('Success! Edited!');
            }
            logTime(now, 'output');
            callback && callback();
        });
    },() => {
        logTime(now, 'output');
        callback && callback();
    });
}

/******* BOOTSTRAP *******/

function start(){
    const now = Date.now();
    requestAttempt(() => {
        requestArticlesData(() => {
            editOutputArticle(() => {
                logTime(now, 'total');
            });
        });
    }, () => {
        logTime(now, 'total');
    });
}

schedule.scheduleJob('0 */12 * * *', function(date){
    log.info('============ Schedule run at: ', date, ' ============');
    start();
});