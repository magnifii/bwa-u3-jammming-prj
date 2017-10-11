const clientId = '131c150d2ba744c3a531daaa83977b96';
const redirectUri = 'http://localhost:3000';

let accessToken;

const Spotify = {

    getAccessToken() {

        if(accessToken) {
            return accessToken;
        }
    
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            let expiresIn = Number(expiresInMatch[1]);
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
        }
    },

    search(searchTerm) {
        let accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${searchTerm}`,
            {headers: {'Authorization': `Bearer ${accessToken}`}}
        ).then(response => {
            if(response.ok) {
                return response.json();
            }
            throw new Error('Request Failed!');
        }, networkError => console.log(networkError.message)
        ).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    // Method doesn't seem to do anything, no action, no errors. Interesting. 
    savePlaylist(name, trackURIs) {
        if(!name || !trackURIs) {
            return;
        }

        let accessToken = Spotify.getAccessToken();
        let headers = { Authorization: `Bearer ${accessToken}`}
        let userId;

        return fetch('https://api.spotify.com/v1/me', {
            headers: headers
        }).then(response => response.json()
        ).then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({name: name})
            }).then(response => response.json()
            ).then(jsonResponse => {
                let playlistId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({uris: trackURIs})
                });
            });
        });
    }

}


export default Spotify;