// Effect Games Engine v1.0
// Copyright (c) 2005 - 2011 Joseph Huckaby
// Source Code released under the MIT License: 
// http://www.opensource.org/licenses/mit-license.php

////
// FontLoader.js
// Preloads fonts and provides URLs for usage
// DHTML Game Engine 1.0 (EffectGames.com)
////

function _FontLoader() {
	// class constructor
	this._fonts = {};
	this._baseProgress = 0;
};

_FontLoader.prototype._loadFonts = function(_obj) {
	var _list = _always_array(_obj);
	
	// step through each image in list
	for (var _idx = 0; _idx < _list.length; _idx++) {
		var _fontArgs = _list[_idx];
		var _font_id = _fontArgs.Name;
		
		// make sure image isn't already loaded
		if (!this._fonts[_font_id]) {
			debugstr("Loading bitmap font: " + _font_id);
			
			var _font = merge_objects(_fontArgs, {
				loaded: false,
				img: new Image()
			});
			
			if (gGame._standalone) {
				_font.img.onerror = function() {
					_throwError("Failed to load font: " + this.src);
				};
				var _url = gGame._homePath + 'fonts/' + _font_id + '.png';
				debugstr("Loading font image: " + _url);
				_font.img.src = _url;
			}
			else {
				_font.img._retries = 5;
				_font.img.onerror = function() {
					Debug.trace('font', "Error loading font: " + this.src);
					this._retries--;
					if (this._retries > 0) {
						Debug.trace('font', this._retries + " retries left, trying again NOW");
						this.src = this.src.replace(/\&rt\=\d+/, '') + '&rt=' + this._retries;
						// var _img = this;
						// setTimeout( function() { _img.src = _img.src.replace(/\&rt\=\d+/, '') + '&rt=' + _img._retries; }, 1000 );
					}
					else {
						_throwError("Failed to load font: " + this.src);
					}
				};
			
				var _url = gGame._homePath + 'api/game_get_font.png' + _composeQueryString({
					game_id: gGame.id,
					rev: gGame._query.rev,
					font: _font_id,
					zoom: gPort._zoomLevel,
					zoom_filter: gGame._def.ZoomFilter,
					mod: gGame._assetModDate
				});
				debugstr("Loading font image: " + _url);
				_font.img.src = _url;
			} // effect image
			
			this._fonts[_font_id] = _font;
		} // unique
	} // foreach image
};

_FontLoader.prototype.reloadAll = function() {
	// reload ALL images (probably for re-zoom)
	var _list = [];
	
	for (var _key in this._fonts) {
		var _font = this._fonts[_key];
		_font.loaded = false;
		delete _font.img;
		_list.push( _font );
	}
	
	this._fonts = {};
	this._baseProgress = 0;
	this._loadFonts( _list );
};

_FontLoader.prototype._getLoadProgress = function() {
	// check image loading progress
	// result will be between 0.0 and 1.0
	if ((_num_keys(this._fonts) - this._baseProgress) == 0) return 1.0;
	var _numLoaded = 0;
	
	for (var _font_id in this._fonts) {
		if (this._fonts[_font_id].loaded) _numLoaded++;
		else {
			var _font = this._fonts[_font_id];
			var _img = _font.img;
			if (typeof(_img.complete) != 'undefined') {
				// good, browser supports 'complete' parameter
				if (_img.complete) {
					_font.loaded = true;
					_numLoaded++;
				}
			}
			else {
				// ugh, probably safari -- must check image width
				if (_img.width > 0) {
					_font.loaded = true;
					_numLoaded++;
				}
			}
		}
	}
	
	return ((_numLoaded - this._baseProgress) / (_num_keys(this._fonts) - this._baseProgress));
};

_FontLoader.prototype._resetProgress = function() {
	// set current state as zero progress, for subsequent
	// loads of additional content
	this._baseProgress = _num_keys(this._fonts);
};

_FontLoader.prototype.reset = function() {
	// clear all images and reset state
	// used when zoom is changed
	this._fonts = {};
	this._baseProgress = 0;
};

_FontLoader.prototype.lookupFont = function(_name) {
	// lookup an image object by its partial url
	return this._fonts[_name];
};

_FontLoader.prototype.getFontURL = function(_name) {
	// get full URL to image given partial URI (ID)
	var font = this.lookupFont(_name);
	if (!font || !font.loaded) return '';
	return font.img.src;
};
