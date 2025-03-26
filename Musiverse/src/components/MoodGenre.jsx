import React, { useState, useEffect, useRef } from "react";
import { FaBackward, FaForward, FaPlay, FaPause, FaThumbsUp, } from "react-icons/fa"; // For icons
import logo from "../assets/logo.png";
import axios from "axios";
import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

const MoodGenre = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [likedSongs, setLikedSongs] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");


  const audioRef = useRef(null);

  const togglePlayPause = () => {
    setIsPlaying((prevIsPlaying) => {
      const newIsPlaying = !prevIsPlaying;
      if (audioRef.current) {
        if (newIsPlaying) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      }
      return newIsPlaying;
    });
  };

  const handleTrackProgress = (e) => setTrackProgress(e.target.value);

  useEffect(() => {
    const fetchAlbums = async () => {
      const response = await fetch("http://localhost:8081/api/albums");
      const data = await response.json();
      setAlbums(data);
    };
    fetchAlbums();
  }, []);
  const handleLikeClick = (track) => {
    // Prepare the payload
    const payload = {
      token: localStorage.getItem("token"),
      trackid: track._id,
    };

    // Send request to toggle like/unlike
    axios
      .post("http://localhost:8081/add_liked_song", payload)
      .then((response) => {
        if (response.data?.msg === "ok") {
          const action = response.data?.action; // Action (liked or unliked)

          if (action === "unliked") {
            // If the track was unliked, remove it from the liked songs list
            setLikedSongs((prevLikedSongs) =>
              prevLikedSongs.filter((t) => t._id !== track._id)
            );
            setSnackbarMessage("Song unliked!");
            setSnackbarSeverity("info");
          } else if (action === "liked") {
            // If the track was liked, add it to the liked songs list
            setLikedSongs((prevLikedSongs) => [...prevLikedSongs, track]);
            setSnackbarMessage("Song liked!");
            setSnackbarSeverity("success");
          }
          setSnackbarOpen(true);
        } else {
          setSnackbarMessage("Error processing your request.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setSnackbarMessage("Network error.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const handleAlbumClick = (album) => {
    setCurrentAlbum(album);
    // Reset track on album change
  };
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = `http://localhost:8081/audios/${currentTrack.audio}`; // Update audio source
      audioRef.current.play(); // Play the new track
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      const interval = setInterval(() => {
        setTrackProgress(audioRef.current.currentTime);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentTrack]);

 
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleTrackClick = (track) => {
    if (audioRef.current && currentTrack?._id !== track._id) {
      audioRef.current.pause(); // Pause the currently playing track
      audioRef.current.currentTime = 0; // Reset time
      audioRef.current.src = `http://localhost:8081/audios/${track.audio}`; // Set the new track source
      audioRef.current.play(); // Start playing the new track
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };
  const handlePreviousTrack = () => {
    if (currentAlbum && currentAlbum.tracks) {
      const prevIndex =
        (currentTrackIndex - 1 + currentAlbum.tracks.length) %
        currentAlbum.tracks.length;
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(currentAlbum.tracks[prevIndex]);
      audioRef.current.src = `http://localhost:8081/audios/${currentAlbum.tracks[prevIndex].audio}`;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  const handleNextTrack = () => {
    if (currentAlbum) {
      const nextIndex = (currentTrackIndex + 1) % currentAlbum.tracks.length;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(currentAlbum.tracks[nextIndex]);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.play() : audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleProgressChange = (e) => {
    const value = e.target.value;
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setTrackProgress(value);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Main Content */}
      <main className="p-6">
        {/* Albums Section */}
        <section id="albums" className="mb-8">
          <h1 className="text-xl font-bold mb-4">Mood & Genre </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album._id}
                className="bg-gray-800 p-4 rounded-lg hover:scale-105 transition-transform cursor-pointer"
                onClick={() => handleAlbumClick(album)}
              >
                <div
                  className="bg-gray-700 h-40 rounded mb-2"
                  style={{
                    backgroundImage: `url(http://localhost:8081/albumimage/${album.genreimage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <p className="text-center">{album.genre}</p>
              </div>
            ))}
          </div>
        </section>

        {currentAlbum && (
          <section id="tracks" className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              🎶 {currentAlbum.albumName} Tracks
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentAlbum.tracks.map((track) => (
                <div
                  key={track._id}
                  className="bg-gray-800 p-4 rounded-lg hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => handleTrackClick(track)}
                >
                  <div
                    className="bg-gray-700 h-40 rounded mb-2"
                    style={{
                      backgroundImage: `url(http://localhost:8081/uploads/${track.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-center">{track.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center">
              <img
                src={`http://localhost:8081/uploads/${currentTrack.image}`}
                alt="Thumbnail"
                className="h-12 w-12 rounded-full"
              />
              <div className="ml-4">
                <p className="font-semibold">{currentTrack.title}</p>
                <p className="text-sm text-gray-400">{currentTrack.artist}</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max={audioRef.current?.duration || 0}
              value={trackProgress}
              onChange={handleProgressChange}
            />
            <audio
              ref={audioRef}
              src={`http://localhost:8081/audios/${currentTrack.audio}`}
            />
            <div className="flex items-center space-x-4">
              <button
                className="p-2 bg-gray-600 rounded-full hover:bg-gray-500"
                onClick={handlePreviousTrack}
              >
                <FaBackward />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 bg-gray-600 rounded-full hover:bg-gray-500"
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button
                className="p-2 bg-gray-600 rounded-full hover:bg-gray-500"
                onClick={handleNextTrack}
              >
                <FaForward />
              </button>
              <button
               onClick={() => handleLikeClick(currentTrack)}
               className={`p-2 bg-gray-600 rounded-full hover:bg-gray-500 ${
                 likedSongs.some(
                   (likedTrack) => likedTrack._id === currentTrack?._id
                 )
                   ? "text-teal-500"
                   : "text-gray-400"
               }`}
              >
               <FaThumbsUp />
              </button>
            </div>
          </div>
        )}
      </main>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MoodGenre;
