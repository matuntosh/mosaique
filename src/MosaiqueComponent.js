/*

The MIT License (MIT)

Copyright (c) Tue May 22 2018 Software Research Associates, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORTOR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function MosaiqueComponent() {
	UIComponent.call(this);
	this._pixelSize = null;
	this._currentImageFile = null;
	this._previousImageFile = null;
	this._imageFileList = null;

	this._canvasComponents = null;
	this._canvasForOriginal = null;
	this._canvasForMosaique = null;
	this._ctxForOriginal = null;
	this._ctxForMosaique = null;

	this._imageBySrc = {};
	this._loadedCount = 0;
	this._srcKeys = null;

	this._sortRects = null;
	this._mosaiquePieces = null;
	this._backgroundOfMosaique = null;
	this._backgroundColorOfOriginal = 'white';

	this._drawWithUniquePieces = true;
	this._cutOverflowingPieces = false;
	this._thresholdDistance = 10000;
	this._divides = 4;
	this._dividesOriginal = 71;

	this._minimumDistanceComponent = null;
	this._maximumDistanceComponent = null;

	this._stateDraw = null;

	this._settingComponent = null;
}
inherits(MosaiqueComponent, UIComponent);

MosaiqueComponent.prototype.stateDrawOriginal = 'stateDrawOriginal';
MosaiqueComponent.prototype.stateCreateMosaique = 'stateCreateMosaique';
MosaiqueComponent.prototype.stateDrawMosaique = 'stateDrawMosaique';
MosaiqueComponent.prototype.stateDraw = function (state) {
	if (state) {
		this._stateDraw = state;
		this.draw();
	}
	return this._stateDraw;
};

MosaiqueComponent.prototype.loadFrom = function (originalImagePath, pieceCsvPath) {
	let self = this,
		srcKey = this.srcKeys().mosaiqueSrc,
		osrcKey = this.srcKeys().originalSrc;
	new FileListLoader([
		{
			name: pieceCsvPath,
			responseType: 'text',
			action: function (text) {
				WaitComponent.open('Loading images ...');
				self.imageFileList(MC.CharacterSeparatedValues.parse(text).filter(function (imageFile) {
					return imageFile[srcKey] != undefined && imageFile[srcKey] != ""
				}), function () {
					let currentFile = {};
					currentFile[osrcKey] = originalImagePath;
					self.currentImageFile(currentFile);
				});
			}
		}
	]).load();
};
MosaiqueComponent.prototype.requestFiles = function () {
	let dialog = new UIComponent(),
		self = this,
		originalImageWasLoaded = false,
		csvFileWasLoaded = false,
		srcKey = this.srcKeys().mosaiqueSrc,
		osrcKey = this.srcKeys().originalSrc;
	dialog.component().className = 'MosaiqueComponent FileDialog';
	let originalImageFileInput = new FileInputArea(function (file) {
		originalImageFileInput.removeComponent();
		let originalImageSrc = 'originalImageFile',
			originalImage = self.newImage(),
			reader = new FileReader();
		originalImage.onload = function () {
			originalImageWasLoaded = true;
			self._imageBySrc[originalImageSrc] = originalImage;
			let currentFile = {};
			currentFile[osrcKey] = originalImageSrc;
			self.currentImageFile(currentFile);
			if (originalImageWasLoaded && csvFileWasLoaded) {
				dialog.removeComponent();
			}
		};
		reader.onload = function () {
			originalImage.src = reader.result;
		};
		reader.readAsDataURL(file);
	}, 'original image file');
	originalImageFileInput.appendTo(dialog.component());
	let mosaiqueCsvFileInput = new FileInputArea(function (file) {
		mosaiqueCsvFileInput.removeComponent();
		let reader = new FileReader();
		reader.onload = function () {
			self.imageFileList(MC.CharacterSeparatedValues.parse(reader.result).filter(function (imageFile) {
				return imageFile[srcKey] && imageFile[srcKey];
			}), function () {
				csvFileWasLoaded = true;
				if (originalImageWasLoaded && csvFileWasLoaded) {
					dialog.removeComponent();
				}
			});
		};
		reader.readAsText(file);
	}, 'mosaique piece csv file');
	mosaiqueCsvFileInput.appendTo(dialog.component());
	dialog.appendTo(this.component());
};

MosaiqueComponent.prototype.pixelSize = function (size) {
	if (size) {
		this._pixelSize = size;
	}
	if (!this._pixelSize) {
//		this._pixelSize = {
//			width: 1920,
//			height: 1920
//		};
        let size = this.size(),
            min = Math.min(size.width, size.height);
        this._pixelSize = {
            width: min,
            height: min
        };
	}
	return this._pixelSize;
};
MosaiqueComponent.prototype.currentImageFile = function (file) {
	if (file) {
		this.previousImageFile(this._currentImageFile);
		this._currentImageFile = file;
		this.stateDraw(this.stateDrawOriginal);
	}
	return this._currentImageFile;
};
MosaiqueComponent.prototype.previousImageFile = function (file) {
	if (file) {
		if (this._previousImageFile) {
			this._previousImageFile.cachedImage = null;
		}
		this._previousImageFile = file;
		if (this._previousImageFile) {
			let image = new Image();
			image.src = this.canvasForOriginal().toDataURL();
			this._previousImageFile.cachedImage = image;
		}
	}
	return this._previousImageFile;
};
MosaiqueComponent.prototype.imageFileList = function (list, finishedAction) {
	if (list) {
		WaitComponent.open('Loading images ...');
		let self = this;
		this.loadImagesFromFiles(list, function () {
			self._imageFileList = list;
			self.stateDraw(self.stateDrawOriginal);
			if (finishedAction) {
				finishedAction();
			}
		});
	}
	return this._imageFileList;
};

MosaiqueComponent.prototype.defaultSrcKeys = {
	originalSrc: 'src',
	mosaiqueSrc: 'src'
};
MosaiqueComponent.prototype.srcKeys = function (srcKeys) {
	if (srcKeys) {
		this._srcKeys = srcKeys;
	}
	if (!this._srcKeys) {
		this._srcKeys = this.defaultSrcKeys;
	}
	return this._srcKeys;
};

MosaiqueComponent.prototype.canvasComponents = function () {
	if (!this._canvasComponents) {
		this._canvasComponents = [new CanvasComponent(), new CanvasComponent()]
	}
	return this._canvasComponents;
};
MosaiqueComponent.prototype.createComponent = function () {
	let c = UIComponent.prototype.createComponent.call(this);

	let canvases = [this.canvasForOriginal(), this.canvasForMosaique()];
	this.canvasComponents().forEach(function (canvasComponent, i) {
		canvasComponent.addCanvas(canvases[i]);
		canvasComponent.appendTo(c);
	});

	return c;
};

MosaiqueComponent.prototype.settingComponent = function () {
	if (!this._settingComponent) {
		this._settingComponent = this.createSettingComponent();
	}
	return this._settingComponent;
};
MosaiqueComponent.prototype.createSettingComponent = function () {
	var settingComponent = null,
		dividesOfOriginal = null,
		dividesOfMatching = null,
		drawWithUniquePiecesSwitch = null,
		findingOrderSwitch = null,
		backgroundColorOriginalCanvasSwitch = null,
		backgroundOfMosaiqueSwitch = null,
		cutOverflowingPiecesSwitch = null,
		thresholdDistanceInput = null,
		self = this;

	settingComponent = new UIComponent();
	settingComponent.component().classList.add('setting');

	dividesOfOriginal = new InputNumberComponent('divides/original', self.dividesOriginal(), 1, '', function (num) {
		return Math.max(1, Math.min(1000, parseInt(num)));
	}, function () {
		self.dividesOriginal(dividesOfOriginal.value());
	});
	dividesOfOriginal.appendTo(settingComponent.component());

	dividesOfMatching = new InputNumberComponent('divides/matching', self.divides(), 1, '', function (num) {
		return Math.max(1, Math.min(8, parseInt(num)));
	}, function () {
		self.divides(dividesOfMatching.value());
	});
	dividesOfMatching.appendTo(settingComponent.component());

	drawWithUniquePiecesSwitch = new SwitchComponent('unique pieces', self.drawWithUniquePieces(), function (s) {
		self.drawWithUniquePieces(s.on());
	});
	drawWithUniquePiecesSwitch.appendTo(settingComponent.component());

	findingOrderSwitch = new SwitchProfileComponent('finding order', {
		LRTB: {
			action: function () {
				self.sortRects(self.sortRectsByLRTB);
			}
		},
		grayscaleWB: {
			action: function () {
				self.sortRects(self.sortRectsByGrayscaleWhiteToBlack);
			}
		},
		grayscaleBW: {
			action: function () {
				self.sortRects(self.sortRectsByGrayscaleBlackToWhite);
			}
		}
	}, 2, function (profile) {
		profile.action();
	});
	findingOrderSwitch.appendTo(settingComponent.component());

	backgroundColorOriginalCanvasSwitch = new SwitchProfileComponent('background color of original image', {
		white: {
			color: 'white'
		},
		black: {
			color: 'black'
		}
	}, this.backgroundColorOfOriginalOptions.indexOf(this.backgroundColorOfOriginal()), function (profile) {
		self.backgroundColorOfOriginal(profile.color);
	});
	backgroundColorOriginalCanvasSwitch.appendTo(settingComponent.component());

	cutOverflowingPiecesSwitch = new SwitchComponent('cut overflowing pieces', self.cutOverflowingPieces(), function (s) {
		self.cutOverflowingPieces(s.on());
	});
	cutOverflowingPiecesSwitch.appendTo(settingComponent.component());

	self.minimumDistanceComponent().appendTo(settingComponent.component());
	self.maximumDistanceComponent().appendTo(settingComponent.component());
	thresholdDistanceInput = new InputNumberComponent('threshold distance', self.thresholdDistance(), 1, '', function (num) {
		return Math.max(0, parseFloat(num));
	}, function () {
		self.thresholdDistance(thresholdDistanceInput.value());
	});
	thresholdDistanceInput.appendTo(settingComponent.component());

	backgroundOfMosaiqueSwitch = new SwitchProfileComponent('background of mosaique', {
		white: {
			name: 'backgroundWhite'
		},
		black: {
			name: 'backgroundBlack'
		},
		originalImage: {
			name: 'backgroundOriginal'
		}
	}, this.backgroundOfMosaiqueOptions.indexOf(self.backgroundOfMosaique()), function (profile) {
		self.backgroundOfMosaique(profile.name);
	});
	backgroundOfMosaiqueSwitch.appendTo(settingComponent.component());

	settingComponent.dividesOfOriginal = dividesOfOriginal;
	settingComponent.dividesOfMatching = dividesOfMatching;
	settingComponent.drawWithUniquePiecesSwitch = drawWithUniquePiecesSwitch;
	settingComponent.findingOrderSwitch = findingOrderSwitch;
	settingComponent.backgroundColorOriginalCanvasSwitch = backgroundColorOriginalCanvasSwitch;
	settingComponent.cutOverflowingPiecesSwitch = cutOverflowingPiecesSwitch;
	settingComponent.thresholdDistanceInput = thresholdDistanceInput;
	settingComponent.backgroundOfMosaiqueSwitch = backgroundOfMosaiqueSwitch;

	return settingComponent;
};
MosaiqueComponent.prototype.initializeComponent = function () {
	UIComponent.prototype.initializeComponent.call(this);
	window.addEventListener('keyup', function (evt) {
		if (evt.ctrlKey && evt.key == ',') {
			toggleSetting();
		}
	});

	let self = this;
	function toggleSetting() {
		if (self.settingComponent().component().parentElement) {
			self.settingComponent().removeComponent();
		} else {
			self.settingComponent().appendTo(self.component());
		}
	}
};
MosaiqueComponent.prototype.minimumDistanceComponent = function () {
	if (!this._minimumDistanceComponent) {
		this._minimumDistanceComponent = new ValueComponent('minimum distance', 10000);
	}
	return this._minimumDistanceComponent;
};
MosaiqueComponent.prototype.maximumDistanceComponent = function () {
	if (!this._maximumDistanceComponent) {
		this._maximumDistanceComponent = new ValueComponent('maximum distance', 0);
	}
	return this._maximumDistanceComponent;
};
MosaiqueComponent.prototype.resizeComponent = function () {
	UIComponent.prototype.resizeComponent.call(this);

	let canvasScale = 1,
		pixelSize = this.pixelSize();
	this.canvasComponents().forEach(function (canvasComponent, i) {
		let rect = canvasComponent.rect();
		canvasComponent.canvasScale(canvasScale);
		canvasComponent.canvasPixelSize({
			width: pixelSize.width,
			height: pixelSize.height
		});
		let min = Math.min(rect.width, rect.height);
		canvasComponent.canvasSize({
			width: min,
			height: min
		});
	});

	this.stateDraw(this.stateDrawOriginal);
};
MosaiqueComponent.prototype.canvasForOriginal = function () {
	if (!this._canvasForOriginal) {
		this._canvasForOriginal = document.createElement('canvas');
	}
	return this._canvasForOriginal;
};
MosaiqueComponent.prototype.canvasForMosaique = function () {
	if (!this._canvasForMosaique) {
		this._canvasForMosaique = document.createElement('canvas');
	}
	return this._canvasForMosaique;
};
MosaiqueComponent.prototype.ctxForOriginal = function () {
	return this.canvasForOriginal().getContext('2d');
};
MosaiqueComponent.prototype.ctxForMosaique = function () {
	return this.canvasForMosaique().getContext('2d');
};

MosaiqueComponent.prototype.backgroundOfMosaiqueOptions = ['backgroundWhite', 'backgroundBlack', 'backgroundOriginal'];
MosaiqueComponent.prototype.backgroundColorOfOriginalOptions = ['white', 'black'];
MosaiqueComponent.prototype.updateMosaiqueOptions = function (options) {
	if (this.backgroundOfMosaique() != options.backgroundOfMosaique) {
		this._backgroundOfMosaique = options.backgroundOfMosaique;
		let index = this.backgroundOfMosaiqueOptions.indexOf(this.backgroundOfMosaique());
		this.settingComponent().backgroundOfMosaiqueSwitch.selectionIndex(index, this);
	}
	if (this.backgroundColorOfOriginal() != options.backgroundColorOfOriginal) {
		this._backgroundColorOfOriginal = options.backgroundColorOfOriginal;
		let index = this.backgroundColorOfOriginalOptions.indexOf(this.backgroundColorOfOriginal());
		this.settingComponent().backgroundColorOriginalCanvasSwitch.selectionIndex(index, this);
	}
	if (this.drawWithUniquePieces() != options.drawWithUniquePieces) {
		this._drawWithUniquePieces = options.drawWithUniquePieces;
		this.settingComponent().drawWithUniquePiecesSwitch.on(this.drawWithUniquePieces(), this);
	}
	if (this.cutOverflowingPieces() != options.cutOverflowingPieces) {
		this._cutOverflowingPieces = options.cutOverflowingPieces;
		this.settingComponent().cutOverflowingPiecesSwitch.on(this.cutOverflowingPieces(), this);
	}
	if (this.thresholdDistance() != options.thresholdDistance) {
		this._thresholdDistance = options.thresholdDistance;
		this.settingComponent().thresholdDistanceInput.value(this.thresholdDistance(), this);
	}
	if (this.divides() != options.divides) {
		this._divides = options.divides;
		this.settingComponent().dividesOfMatching.value(this.divides(), this);
	}
	if (this.dividesOriginal() != options.dividesOriginal) {
		this._dividesOriginal = options.dividesOriginal;
		this.settingComponent().dividesOfOriginal.value(this.dividesOriginal(), this);
	}
};
MosaiqueComponent.prototype.standbyOriginalImageAndMosaiqueImage = function (readyOriginalImageAction, readyMosaiqueImageAction) {
	let self = this;
	this.loadImage(this.currentImageFile()[this.srcKeys().originalSrc], function (image) {
        if (self.stateDraw() != self.stateDrawMosaique) {
			self.drawOriginal(image);
			readyOriginalImageAction(function () {
				self.standbyMosaiqueImage(readyMosaiqueImageAction);
			});
        } else {
			self.standbyMosaiqueImage(readyMosaiqueImageAction);
		}
	});
};
MosaiqueComponent.prototype.standbyMosaiqueImage = function (readyMosaiqueImageAction) {
	let self = this;
	this.cursorWait();
	setTimeout(function () {
		if (self.currentImageFile() && self.currentImageFile().mosaiquePieces) {
			self.mosaiquePieces(self.currentImageFile().mosaiquePieces);
		} else {
			if (self.stateDraw() != self.stateDrawMosaique) {
				self.createMosaique();
			}
		}
		self.drawMosaique();
		readyMosaiqueImageAction(function () {
			self._stateDraw = self.stateDrawMosaique;
		});
		self.cursorDefault();
	}, 100);
};
MosaiqueComponent.prototype.loadImagesFromFiles = function (list, finishedAction) {
	let self = this,
		pieceSize = this.pieceSize(),
		srcKey = this.srcKeys().mosaiqueSrc;
	list.forEach(function (imageFile) {
		let image = self.newImage(),
			src = imageFile[srcKey];
		MediaFileLoader.instance().addMediaFile(src, 'image', function (image, url) {
			meanColorsWithImage(image, url, pieceSize.width, pieceSize.height, self.divides());
			self._loadedCount += 1;
			WaitComponent.message('Loading images ... ' + self._loadedCount + '/' + (list.length));
		}, image);
		self._imageBySrc[src] = image;
	});
	MediaFileLoader.instance().maxLoadingCount(1000);
	MediaFileLoader.instance().resume(function () {
		WaitComponent.close();
		if (finishedAction) {
			finishedAction();
		}
	});
};
MosaiqueComponent.prototype.newImage = function () {
	let image = new Image();
	image.crossOrigin = 'anonymous';
	return image;
};
MosaiqueComponent.prototype.loadImage = function (src, action, _cache) {
	let image = this._imageBySrc[src],
		cache = _cache != false,
		self = this;
	if (image) {
		if (action) {
			action(image, src);
		}
		return;
	}

	image = this.newImage();
	MediaFileLoader.instance().loadMediaFile(src, 'image', function (media) {
		if (action) {
			action(image, src);
		}
		self._loadedCount += 1;
	}, image);
	if (cache) {
		self._imageBySrc[src] = image;
	}
};

// mosaique
MosaiqueComponent.prototype.mosaiquePieces = function (pieces) {
	if (pieces) {
		this._mosaiquePieces = pieces;
	}
	return this._mosaiquePieces;
};
MosaiqueComponent.prototype.createMosaique = function () {
	if (!this.imageFileList()) {
		return false;
	}

	let self = this,
		srcKey = this.srcKeys().mosaiqueSrc,
		osrcKey = this.srcKeys().originalSrc,
		foundPieces = {},
		pieceSize = this.pieceSize(),
		divideRectsOfOriginalImage = createRectArray(this.dividesOriginal(), this.dividesOriginal(), pieceSize.width, pieceSize.height);
	divideRectsOfOriginalImage = this.sortRects().call(this, this.ctxForOriginal(), divideRectsOfOriginalImage);

	this.mosaiquePieces(divideRectsOfOriginalImage.map(function (rect, findingIndex) {
		let medianColors = meanColorsWithContext(self.ctxForOriginal(), rect.x, rect.y, rect.width, rect.height, self.divides()),
			isTranceparent = isTranceparentColors(medianColors),
			similarImageFile = isTranceparent ? null : self.findSimilarImageFileWithImageData(self.imageFileList(), medianColors, rect.width, rect.height, self.drawWithUniquePieces() ? foundPieces : null),
			displayImage = similarImageFile ? self._imageBySrc[similarImageFile[srcKey]] : null;

		if (similarImageFile) {
			foundPieces[similarImageFile[srcKey]] = similarImageFile;
		}

		let piece = {
			image: displayImage,
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
			findingOrder: findingIndex
		};
		piece[srcKey] = similarImageFile ? similarImageFile[srcKey] : null;
		piece[osrcKey] = similarImageFile ? similarImageFile[osrcKey] : null;

		return piece;
	}));

	return true;
};
MosaiqueComponent.prototype.sortRects = function (action) {
	if (action) {
		this._sortRects = action;
		this.stateDraw(this.stateCreateMosaique);
	}
	if (!this._sortRects) {
		this._sortRects = this.sortRectsByGrayscaleBlackToWhite;
	}
	return this._sortRects;
};
MosaiqueComponent.prototype.sortRectsByLRTB = function (ctx, rects) {
	return rects;
};
MosaiqueComponent.prototype.sortRectsByGrayscaleWhiteToBlack = function (ctx, rects) {
	return this.sortRectsByGrayscale(ctx, rects, function (v1, v2) {
		return v1.distance - v2.distance;
	});
};
MosaiqueComponent.prototype.sortRectsByGrayscaleBlackToWhite = function (ctx, rects) {
	return this.sortRectsByGrayscale(ctx, rects, function (v1, v2) {
		return v2.distance - v1.distance;
	});
};
MosaiqueComponent.prototype.sortRectsByGrayscale = function (ctx, rects, comparator) {
	let white = 255,
		grayscaleArrayList = rects.map(function (rect) {
			let grayscaleArray = grayscaleArrayOn(ctx, rect),
				sum = 0;
			grayscaleArray.forEach(function (grayscale) {
				let diff = white - grayscale;
				sum += diff * diff;
			});
			return {
				rect: rect,
				array: grayscaleArray,
				distance: Math.sqrt(sum)
			};
		});
	let sortedArray = grayscaleArrayList.sort(comparator);
	return sortedArray.map(function (v) {
		return v.rect;
	});
};
MosaiqueComponent.prototype.findSimilarImageFileWithImageData = function (imageFileList, imageData, width, height, excludeSrcMap) {
	let foundImageFile = null,
		image = null,
		imageData2 = null,
		distance = null,
		minimumDistance = null,
		maximumDistance = null,
		self = this,
		srcKey = this.srcKeys().mosaiqueSrc;
	imageFileList.forEach(function (imageFile) {
		let src = imageFile[srcKey];
		if (excludeSrcMap && excludeSrcMap[src]) {
			return;
		}
		image = self._imageBySrc[src];
		imageData2 = meanColorsWithImage(image, src, width, height, self.divides());
		distance = distanceOfPixels(imageData, imageData2);
		if (minimumDistance == null || minimumDistance > distance) {
			foundImageFile = imageFile;
			minimumDistance = distance;
		}
		if (maximumDistance == null || maximumDistance < distance) {
			maximumDistance = distance;
		}
	});
	if (this.minimumDistanceComponent().value() > minimumDistance) {
		this.minimumDistanceComponent().value(minimumDistance);
	}
	if (this.maximumDistanceComponent().value() < maximumDistance) {
		this.maximumDistanceComponent().value(maximumDistance);
	}
	if (minimumDistance > this.thresholdDistance()) {
		return null;
	}
	return foundImageFile;
};
MosaiqueComponent.prototype.backgroundWhite = function () {
	this.ctxForMosaique().fillStyle = 'white';
	this.ctxForMosaique().fillRect(0, 0, this.pixelSize().width, this.pixelSize().height);
}
MosaiqueComponent.prototype.backgroundBlack = function () {
	this.ctxForMosaique().fillStyle = 'black';
	this.ctxForMosaique().fillRect(0, 0, this.pixelSize().width, this.pixelSize().height);
}
MosaiqueComponent.prototype.backgroundOriginal = function () {
	this.ctxForMosaique().drawImage(this.canvasForOriginal(), 0, 0, this.canvasForOriginal().width, this.canvasForOriginal().height, 0, 0, this.pixelSize().width, this.pixelSize().height);
}
MosaiqueComponent.prototype.backgroundOfMosaique = function (symbol) {
	if (symbol) {
		this._backgroundOfMosaique = symbol;
		this.stateDraw(this.stateDrawMosaique);
	}
	if (!this._backgroundOfMosaique) {
		this._backgroundOfMosaique = 'backgroundWhite';
	}
	return this._backgroundOfMosaique;
};
MosaiqueComponent.prototype.backgroundColorOfOriginal = function (color) {
	if (color) {
		this._backgroundColorOfOriginal = color;
		this.stateDraw(this.stateDrawOriginal);
	}
	return this._backgroundColorOfOriginal;
};
MosaiqueComponent.prototype.backgroundMosaiqueFunctions = {
	backgroundWhite: MosaiqueComponent.prototype.backgroundWhite,
	backgroundBlack: MosaiqueComponent.prototype.backgroundBlack,
	backgroundOriginal: MosaiqueComponent.prototype.backgroundOriginal
};
MosaiqueComponent.prototype.drawWithUniquePieces = function (aBoolean) {
	if (aBoolean !== undefined) {
		this._drawWithUniquePieces = aBoolean;
		this.stateDraw(this.stateCreateMosaique);
	}
	return this._drawWithUniquePieces;
};
MosaiqueComponent.prototype.cutOverflowingPieces = function (aBoolean) {
	if (aBoolean !== undefined) {
		this._cutOverflowingPieces = aBoolean;
		this.stateDraw(this.stateDrawOriginal);
	}
	return this._cutOverflowingPieces;
};
MosaiqueComponent.prototype.thresholdDistance = function (num) {
	if (num !== undefined) {
		this._thresholdDistance = num;
		this.stateDraw(this.stateCreateMosaique);
	}
	return this._thresholdDistance;
};
MosaiqueComponent.prototype.divides = function (num) {
	if (num !== undefined) {
		this._divides = num;
		this.stateDraw(this.stateDrawOriginal);
	}
	return this._divides;
};
MosaiqueComponent.prototype.dividesOriginal = function (num) {
	if (num !== undefined) {
		this._dividesOriginal = num;
		this.stateDraw(this.stateCreateMosaique);
	}
	return this._dividesOriginal;
};
MosaiqueComponent.prototype.pieceSize = function () {
	return {
		width: this.pixelSize().width / this.dividesOriginal(),
		height: this.pixelSize().height / this.dividesOriginal()
	};
};

// drawing
MosaiqueComponent.prototype.draw = function () {
	if (!this.currentImageFile()) {
		return;
	}
	this.standbyOriginalImageAndMosaiqueImage(function (endAction) {
		endAction();
	}, function (endAction) {
		endAction();
	});
};
MosaiqueComponent.prototype.drawOriginal = function (image) {
	let ctx = this.ctxForOriginal(),
		imageAspect = image.width / image.height,
		pixelSize = this.pixelSize(),
		pieceSize = this.pieceSize(),
		width = pieceSize.width,
		height = pieceSize.height,
		drawWidth = pixelSize.width,
		drawHeight = drawWidth / imageAspect;
	if (drawHeight > pixelSize.height) {
		drawHeight = pixelSize.height;
		drawWidth = drawHeight * imageAspect;
	}
	let x = (pixelSize.width - drawWidth) / 2,
		y = (pixelSize.height - drawHeight) / 2,
		whiteLeft = Math.floor(x / width) * width,
		whiteRight = Math.ceil((x + drawWidth) / width) * width,
		whiteTop = Math.floor(y / height) * height,
		whiteBottom = Math.ceil((y + drawHeight) / height) * height;
	ctx.clearRect(0, 0, pixelSize.width, pixelSize.height);
	if (!this.cutOverflowingPieces()) {
		ctx.fillStyle = this.backgroundColorOfOriginal();
		ctx.fillRect(whiteLeft, whiteTop, whiteRight - whiteLeft, whiteBottom - whiteTop);
	}
	ctx.drawImage(image, 0, 0, image.width, image.height, Math.floor(x), Math.floor(y), Math.floor(drawWidth), Math.floor(drawHeight));
};
MosaiqueComponent.prototype.drawMosaique = function () {
	if (!this.mosaiquePieces()) {
		return;
	}
	let self = this;
	this.ctxForMosaique().clearRect(0, 0, this.pixelSize().width, this.pixelSize().height);
	this.backgroundMosaiqueFunctions[this.backgroundOfMosaique()].call(this);
	this.mosaiquePieces().forEach(function (piece, index) {
		if (piece.image) {
			drawImageFitIn(self.ctxForMosaique(), piece.image, piece.x, piece.y, piece.width, piece.height);
		}
	});
};
