# Tunzo Player 🎵

[![npm version](https://img.shields.io/npm/vtunzo-player.svg?style=for-the-badge)](https://www.npmjs.com/package/tunzo-player)
[![npm downloads](https://img.shields.io/npm/dt/tunzo-player.svg?style=for-the-badge)](https://www.npmjs.com/package/tunzo-player)
[![License](https://img.shields.io/npm/l/tunzo-player.svg?style=for-the-badge)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=for-the-badge)](#)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](#)
[![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)](#)

> Built for the **Tunzo Music App** — now available as a reusable npm package  
> A feature-rich audio playback utility for Angular + Ionic applications

<!-- ![Tunzo Player Demo](https://via.placeholder.com/800x400?text=Tunzo+Player+Demo+GIF/Image)  
*(Consider adding a real screenshot or animated GIF here)* -->

## ✨ Features

| Category       | Features                                                                 |
|----------------|--------------------------------------------------------------------------|
| **Playback**   | Queue management, Shuffle, Repeat, Crossfade                            |
| **Quality**    | Dynamic stream quality (12kbps to 320kbps)                              |
| **UI**         | Dark/Light theme support with auto-detection                            |
| **Storage**    | Firestore & localStorage integration for favorites                      |
| **Modular**    | Reusable service classes with clean API                                  |


## 💻 Basic Usage

```bash
import { 
  TunzoPlayer,
  StreamSettings, 
  ThemeManager,
  Favorites,
  TunzoPlayerAPI
} from '/tunzo-player';

// Initialize components
const player = new TunzoPlayer();
const api = new TunzoPlayerAPI();

// Example workflow
async function playMusic() {
  // Search songs
  const results = await api.searchSongs('popular songs');
  
  // Play first result
  player.playSong(results[0]);
  
  // Like the song
  Favorites.like(results[0]);
  
  // Set quality to High
  StreamSettings.setQuality(3);
  
  // Enable dark mode
  ThemeManager.toggleDarkMode(true);
}
```

## 🚀 Installation

```bash
npm i tunzo-player
# or
yarn add tunzo-player
```

## 🎚️ Stream Quality Options

| Value | Label             |
| ----- | ----------------- |
| 0     | Very Low (12kbps) |
| 1     | Low (48kbps)      |
| 2     | Medium (96kbps)   |
| 3     | High (160kbps)    |
| 4     | Ultra (320kbps)   |

# tunzo-player
