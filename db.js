const mongoose = require('mongoose');


const Color = new mongoose.Schema({
	hex: String,
});

const Palette = new mongoose.Schema({
	user: String,
	name: String,
  colors: [Color],
});

const User = new mongoose.Schema({
	username: String,
	password: String,
  palettes: [Palette],
});



mongoose.model('Color', Color);
mongoose.model('Palette', Palette);
mongoose.model('User', User);

mongoose.connect('DATABASECONNECTIONHERE');
