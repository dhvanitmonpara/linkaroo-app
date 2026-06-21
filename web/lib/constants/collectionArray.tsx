"use client";

import { PiCardsFill } from "react-icons/pi";
import { RiTaskFill } from "react-icons/ri";
import { GiCard7Diamonds } from "react-icons/gi";
import {
  FaBook,
  FaBookmark,
  FaBreadSlice,
  FaFilm,
  FaGamepad,
  FaMusic,
  FaTv,
} from "react-icons/fa6";
import { FaFootballBall, FaPlayCircle } from "react-icons/fa";

const CollectionTypeArray = [
  { value: "movies", label: "Movies", icon: <FaFilm /> },
  { value: "anime", label: "Anime", icon: <FaFilm /> },
  { value: "manga", label: "Manga", icon: <FaBook /> },
  { value: "books", label: "Books", icon: <FaBook /> },
  { value: "music", label: "Music", icon: <FaMusic /> },
  { value: "playlists", label: "Playlists", icon: <FaPlayCircle /> },
  { value: "tv-shows", label: "TV Shows", icon: <FaTv /> },
  { value: "video-games", label: "Video Games", icon: <FaGamepad /> },
  { value: "food", label: "Food", icon: <FaBreadSlice /> },
  { value: "sports", label: "Sports", icon: <FaFootballBall /> },
  { value: "bookmarks", label: "Bookmarks", icon: <FaBookmark /> },
];

const CollectionTypeCustomArray = [
  { value: "cards", label: "Cards", icon: <PiCardsFill /> },
  { value: "todos", label: "Todos", icon: <RiTaskFill /> },
  { value: "banners", label: "Banners", icon: <GiCard7Diamonds /> },
];

export { CollectionTypeArray, CollectionTypeCustomArray };
