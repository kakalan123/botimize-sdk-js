import request from 'request';

const API_URL = 'https://api.botimize.io';

function makeRequest(options, cb) {
  // send request to api server
  try {
    request(options, (err, res, body) => {
      if (err) {
        return cb && cb(err);
      }
      if (body && body.error) {
        return cb && cb(body.error.message);
      }
      cb && cb(null, body);
    });
  } catch (err) {
    console.log(err);
  }
}

class BotimizeCore {
  /*
   * constructor
   *
   *  @param apiKey the access token for sending events to botimize api server.
   */
  constructor(apiKey, platform, options) {
    if (!apiKey) {
      throw new Error('No API key provided');
    }
    if (platform !== 'facebook') {
      throw new Error('Specified platform is not supported: ' + platform);
    }
    this.apiKey = apiKey;
    this.platform = platform;
    this.apiUrl = options.apiUrl || API_URL;
    this.debug = options.debug || false;
    // super properties
    this.superProperties = {
      platform: platform,
      tag: 'unknown',
    };
  }

  /*
   * track
   *  track event
   *
   *  @param event the event name.
   *  @param properties the event properties.
   */
  track(event, properties) {
    const _props = JSON.parse(JSON.stringify(properties));

    const options = {
      method: 'POST',
      uri: this.apiUrl + '/messages',
      qs: {
        apikey: this.apiKey,
      },
      json: true,
      body: {
        tag: this.superProperties.tag,
        platform: this.platform,
        direction: event,
        raw: _props,
      },
    };
    makeRequest(options, (error) => {
      if (error) {
        console.log('failed to send track event to botimize server.');
        console.log(error);
      }
    });
  }

  logIncoming(data, source = 'npm') {
    const prefix = `[botimize][${this.platform}][incoming][${source}]`;
    if (this.debug) {
      console.log(`${prefix}: ${JSON.stringify(data, null, 2)}`);
    }
    this.track('incoming', data);
  }

  logOutgoing(data, source = 'npm') {
    const prefix = `[botimize][${this.platform}][outgoing][${source}]`;
    if (this.platform === 'facebook' && source === 'npm') {
      let newData = data.json;
      newData.access_token = data.qs.access_token;
      if (this.debug) {
        console.log(`${prefix}: ${JSON.stringify(newData, null, 2)}`);
      }
      this.track('outgoing', newData);
    } else {
      if (this.debug) {
        console.log(`${prefix}: ${JSON.stringify(data, null, 2)}`);
      }
      this.track('outgoing', data);
    }
  }

  /*
   *  notify
   *      send a notification event.
   */
  notify(data, via = 'email') {
    const options = {
      method: 'POST',
      uri: this.apiUrl + '/projects/notify',
      qs: {
        apikey: this.apiKey,
        via: via,
      },
      json: true,
      body: data,
    };
    makeRequest(options, (error) => {
      if (error) {
        console.log('failed to send notification to botimize server.');
        console.log(error);
      }
    });
  }
}

export default function botimize(apiKey, platform, options = {}) {
  return new BotimizeCore(apiKey, platform, options);
}
