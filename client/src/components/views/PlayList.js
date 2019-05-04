import React, { useState } from 'react';

import axios from 'axios';

import { getCookie } from '../../utilities/CookieUtils';

import server from '../../server.json';
import cross from '../../assets/images/cross.png';

const PlayList = (props) => {
  const {
    userRole,
    playlistData: {
      accessLink, spotifyName, pin, creator,
    },
    songs,
    refreshPlaylist,
    copyAccessLink
  } = props;

  console.log({ songs });

  const [removeStatus, setRemoveStatus] = useState({ songId: null, position: null });

  const millisToHoursAndMinutesAndSeconds = (millis) => {
    let hours = 0;
    let minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    if (minutes > 60) {
      minutes %= 60;
      hours = 60 / 60;
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes} hours`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} minutes`;
  };

  const totalSongDuration = () => {
    let duration = 0;
    songs.map((song) => {
      duration += song.duration;
      return null;
    });
    return millisToHoursAndMinutesAndSeconds(duration);
  };

  const removeSong = async (songId, position) => {
    const headers = getCookie();
    const bodyFormData = new FormData();
    bodyFormData.set('songId', songId);
    bodyFormData.set('position', position);

    setRemoveStatus({ songId, position });

    try {
      await axios({
        method: 'DELETE', url: `${server.url}/party/removeSong`, data: bodyFormData, headers, withCredentials: true,
      });

      refreshPlaylist();
      setTimeout(() => setRemoveStatus({ songId: null, position: null }), 100);
    } catch (e) {
      setRemoveStatus({ songId: null, position: null });
      console.log(e);
    }
  };

  const isValidToDelete = (creatorId) => {
    const userId = localStorage.getItem('userId');

    if (userId) {
      if (creator.id === userId) {
        return true;
      } else {
        return userId === creatorId;
      }
    }
    return null;
  };

  const songRemoveButton = (creatorId, songId, index, state) => {
    if (isValidToDelete(creatorId)) {
      if (state.position === index) {
        return <span className="spinner" />;
      } else {
        return (
          <button
            type="button"
            className="delete-button"
            onClick={() => removeSong(songId, index)}
            style={{
              backgroundImage: `url(${cross})`,
              backgroundPosition: 'center',
              backgroundSize: '14px 14px',
              backgroundRepeat: 'no-repeat',
            }}
          />
        );
      }
    }
    return null;
  };

  const songItem = (item, index) => (
    <div key={item.id} className="song-wrapper">
      <img alt="album-cover" className="album-cover" src={item.albumCoverUrl} />
      <div className={isValidToDelete(item.creator.id) ? 'text-info short-ellipsis' : 'text-info'}>
        <p>{item.name}</p>
        <p>{item.artists.map((artist, artistIndex) => <span key={artist.id}>{artistIndex !== item.artists.length - 1 ? `${artist.name}, ` : artist.name}</span>)}</p>
        <p>{`Added by ${item.creator.username}`}</p>
      </div>
      {songRemoveButton(item.creator.id, item.id, index, removeStatus)}
    </div>
  );

  if (songs.length) {
    return (
      <div className="play-list-container">
        <div className="play-list-stats">
          <span>{songs.length > 1 ? `${songs.length} songs` : `${songs.length} song`}</span>
          <span>  -  </span>
          <span>{totalSongDuration()}</span>
        </div>
        <div className="playlist-songs-container" data-scroll-lock-scrollable>
          {songs.map((song, index) => songItem(song, index))}
        </div>
        <div className="transparent-gradient" />
      </div>
    );
  } else {
    switch (userRole) {
      case 'participant':
        return (
          <div className="play-list-container center">
            <p>
            The playlist is empty.
              <br />
            Start adding songs to the playlist.
            </p>
          </div>
        );
      case 'admin':
        return (
          <div className="play-list-container center">
            <div className="playlist-name">
              <span>PLAYLIST NAME</span>
              <br />
              <span><a target='_new' href={accessLink}>{spotifyName}</a></span>
              <br />
              <span>Click on the playlist name to open it in Spotify.</span>
            </div>
            <span className="dashed-separator" />
            <div className="playlist-pin">
              <span>PARTY PIN</span>
              <br />
              <span>{pin}</span>
              <br />
              <span>Share this with your friends.</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  }
};

export default PlayList;
