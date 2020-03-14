const axios = require('axios');
const qs = require('querystring')
const fs = require('fs');
let secrets = null;
let users = null;

class SpotifyInstance {
  constructor () {
    try {
      secrets = require('./secrets.json')
      users = require('./spotify.json')
    } catch (e) {
      throw new Error('Spotify files not present, SpotifyInstance cannot be instantiated');
    }
    if (!this.isUsingSpotify()) {
      throw new Error('User is not using Spotify, SpotifyInstance cannot be instantiated');
    }
    
    this.API_URL = 'https://api.spotify.com/v1';
    this.ACCOUNT_URL = 'https://accounts.spotify.com/api';
    this.user = users[0];
    this.randomID = Math.random() * 1000;
  }

  isUsingSpotify () {
    return users[0];
  }

  async fetchAccessToken (props) {
    return await axios.post(`${this.ACCOUNT_URL}/token`, qs.stringify({
      redirect_uri: secrets.redirect_uri,
      ...props
    }), 
    { headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${secrets.client_id}:${secrets.client_secret}`).toString('base64')}` 
      }
    })
    .then(r => r.data)
    .catch(e => console.log(e.response));
  }

  async getToken () {
    const tokens = await this.refreshToken(this.user.auth.refresh_token);
    return tokens
  }

  async refreshToken (refresh_token) {
    return await this.fetchAccessToken({
      grant_type: 'refresh_token',
      refresh_token
    });
  }

  async hasTokenExpired (user) {
    if (!user || !user.auth) {
      return true;
    }
    if (user && Date.now() > user.auth.expires_in) {
      return true;
    } else {
      return false;
    }
  }

  getCachedToken () {
    const dir = './spotify.json'
    const file = require(dir)
    try {
      return file[0].auth;
    } catch (err) {
      console.error('error when getting cached token');
    }
  }

  async getUser () {
    const token = await this.getToken();
    const user = await axios.get(`${this.API_URL}/me`, {
      'Authorization': `Bearer ${token.access_token}`
    }).then(a => a.data);
    return user;
  }

  store (data) {
    const dir = './spotify.json'
    if (!fs.exists(dir)) {
      fs.writeFile(dir);
    }
    const file = fs.readFile(dir);
    try {
      const parsed = JSON.parse(file);
      parsed[0] = {
        id: user.id,
        username: user.display_name,
        auth: {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_in: Date.now() + (token.expires_in * 1000)
        }
      }
      fs.writeFile(dir, parsed);
    } catch (err) {
      console.error('Error whilst reading Spotify file');
    }
  }

  updateTokens (user, tokens) {
    const dir = './spotify.json'
    if (!fs.exists(dir)) {
      fs.writeFile(dir, {});
    }
    const file = fs.readFile(dir);
    try {
      const parsed = JSON.parse(file);
      parsed[0] = Object.assign(parsed, {
        auth: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: Date.now() + (tokens.expires_in * 1000)
        }
      });
      fs.writeFile(dir, parsed);
      return tokens;
    } catch (err) {
      console.error('Error whilst reading Spotify file');
    }
  }

  async getCurrentSong () {
    const auth = await this.getToken();
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${auth.access_token}` } }).then(a => a.data).catch(e=>console.log(e.response));
    return response.item;
  }

  async getCurrentAlbumArt (returnSong = false) {
    const auth = await this.getToken();
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${auth.access_token}` } }).then(a => a.data).catch(e=>console.log(e.response));
    const albumart = response.item.album.images[0] || null;
    
    if (response.is_playing && albumart && response.item.id !== this.currentlyPlaying) {
      this.currentlyPlaying = response.item.id;
      const circle = document.querySelector('.song-art');
      circle.style.backgroundImage = `url('${albumart.url}')`;
      circle.style.backgroundSize = `101%`;
    }

    if (returnSong) {
      return response;
    }
    return albumart;
  }
}

module.exports = SpotifyInstance;