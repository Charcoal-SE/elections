const express = require('express');
const rd = require('redis');
const request = require('request-promise');
const $ = require('cheerio');
const logger = require('morgan');

//===========//
// APP SETUP //
//===========//

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

//========================//
// REDIS & DATA UTILITIES //
//========================//

const apiKey = 'lKfzuApO1ASY*NegoDzU0g((';

const client = rd.createClient();
const redis = {
  get: key => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    });
  },

  set: (key, val, expire = null) => {
    return new Promise((resolve, reject) => {
      const params = [key, val];
      if (!!expire) params.push('EX', expire);
      client.set(...params, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    });
  }
};

const inGroups = (ary, groupSize) => {
  return ary.map((x, i) => {
    return i % groupSize === 0 ? ary.slice(i, i + groupSize) : null;
  }).filter(x => !!x);
};

const getSiteUrl = siteParam => {
  const specialCases = {
    'stackoverflow': 'stackoverflow.com',
    'mathoverflow': 'mathoverflow.net',
    'askubuntu': 'askubuntu.com',
    'superuser': 'superuser.com',
    'serverfault': 'serverfault.com'
  };
  return !!specialCases[siteParam] ? specialCases[siteParam] : `${siteParam}.stackexchange.com`;
};

const getMetaSiteParam = siteParam => {
  const specialCases = {
    'stackoverflow': 'meta.stackoverflow',
    'mathoverflow': 'meta.mathoverflow.net',
    'askubuntu': 'meta.askubuntu',
    'superuser': 'meta.superuser',
    'serverfault': 'meta.serverfault'
  };
  return !!specialCases[siteParam] ? specialCases[siteParam] : `${siteParam}.meta`;
};

//===============//
// DATA SCRAPERS //
//===============//

const scrapeElectionData = async siteParam => {
  const data = {};
  const domain = getSiteUrl(siteParam);
  const url = `https://${domain}/election`;

  const page = await request(url);
  const electionName = $('.subheader h1', page).first().text().trim();
  if (electionName === 'Community Moderator Elections') {
    // No active election
    data.activeElection = false;

    redis.set(`elections-site-${siteParam}`, JSON.stringify(data), 10);
    return data;
  }

  data.activeElection = true;
  data.name = electionName;
  data.phase = $('#tabs a.is-selected', page).first().text().trim();

  const linksList = $('.wiki-ph-content ul', page).last().find('li a');
  data.chat = linksList.first().attr('href');
  data.questions = linksList.last().attr('href');

  const meta = $('.module', page).first().find('p').toArray().map(p => $(p).text().trim());
  data.meta = inGroups(meta, 2);

  const nominationCells = $('.candidate-row', page).toArray();
  data.nominations = nominationCells.map(c => {
    const userLink = `https://${domain}` + $(c).find('.user-details a').attr('href');
    const splat = userLink.split('/');
    const userId = splat[splat.length - 2];
    return {
      nomination: $(c).find('.post-text').html(),
      score: $(c).find('.candidate-score-breakdown').html(),
      user: {
        url: userLink,
        id: userId,
        avatar: $(c).find('.user-gravatar32 img').attr('src'),
        name: $(c).find('.user-details a').text().trim()
      },
    };
  });

  redis.set(`elections-site-${siteParam}`, JSON.stringify(data), 300);
  return data;
};

const scrapeUserData = async (siteParam, userId) => {
  const data = {};
  const domain = getSiteUrl(siteParam);
  const profileUrl = `https://${domain}/users/${userId}?tab=topactivity`;
  const apiUrl = `https://api.stackexchange.com/2.2/users/${userId}?site=${siteParam}&filter=!bYx2ADoMV0*K(r&key=${apiKey}`;
  const apiMetaUrl = `https://api.stackexchange.com/2.2/users/${userId}?site=${getMetaSiteParam(siteParam)}&filter=!bYx2ADoMV0*K(r&key=${apiKey}`;
  let responses = [request(profileUrl), request({uri: apiUrl, gzip: true}), request({uri: apiMetaUrl, gzip: true})];

  responses = await Promise.all(responses);

  let [profileData, apiData, apiMetaData] = responses;
  console.log(apiData);
  apiData = JSON.parse(apiData).items[0];
  apiMetaData = JSON.parse(apiMetaData).items[0];

  data.posts = apiData.question_count + apiData.answer_count;
  data.metaPosts = apiMetaData.question_count + apiMetaData.answer_count;
  data.joinedYear = new Date(apiData.creation_date * 1000).getFullYear();

  const stats = $('#top-cards aside', profileData).eq(2).children().first().children('.grid--cell').last().children().children().toArray();
  data.edits = $(stats[0]).find('a').first().text().split(' ')[0].trim();
  data.flags = $(stats[1]).find('.grid--cell').last().text().split(' ')[0].trim();

  data.votes = {
    total: apiData.up_vote_count + apiData.down_vote_count,
    up: apiData.up_vote_count,
    down: apiData.down_vote_count
  };

  data.badges = {
    gold: apiData.badge_counts.gold,
    silver: apiData.badge_counts.silver,
    bronze: apiData.badge_counts.bronze
  };

  data.accounts = $('#user-panel-accounts', profileData).find('a span').first().text().trim().replace(/[\(\)]/g, '');

  redis.set(`elections-user-${siteParam}-${userId}`, JSON.stringify(data), 300);
  return data;
};

//================//
// ROUTING STARTS //
//================//

app.get('/api/elections', async (req, res) => {
  res.json(JSON.parse(await redis.get('elections')));
});

app.get('/api/site/:siteParam', async (req, res) => {
  let data = JSON.parse(await redis.get(`elections-site-${req.params['siteParam']}`));
  let fromRedisCache = true;
  if (!data) {
    data = await scrapeElectionData(req.params['siteParam']);
    fromRedisCache = false;
  }
  res.json({data, cacheStatus: fromRedisCache ? 'hit' : 'miss' });
});

app.get('/api/user/:siteParam/:userId', async (req, res) => {
  let data = JSON.parse(await redis.get(`elections-user-${req.params['siteParam']}-${req.params['userId']}`));
  let fromRedisCache = true;
  if (!data) {
    data = await scrapeUserData(req.params['siteParam'], req.params['userId']);
    fromRedisCache = false;
  }
  res.json({data, cacheStatus: fromRedisCache ? 'hit' : 'miss'});
});

module.exports = app;
