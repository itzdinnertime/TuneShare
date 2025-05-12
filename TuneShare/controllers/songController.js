const Song = require('../models/Song');

exports.getAllSongs = async (req, res) => {
    try {
        const songs = await Song.find();
        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving songs', error });
    }
};

exports.addSong = async (req, res) => {
    const { title, artist, album, genre, releaseDate, duration } = req.body;

    try {
        const newSong = new Song({ title, artist, album, genre, releaseDate, duration });
        const savedSong = await newSong.save();
        res.status(201).json(savedSong);
    } catch (error) {
        res.status(400).json({ message: 'Error adding song', error });
    }
};

exports.deleteSong = async (req, res) => {
    const { id } = req.params;

    try {
        await Song.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting song', error });
    }
};