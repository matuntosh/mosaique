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
	this._imageFileList = null;

	this._canvasComponents = null;
	this._canvasForOriginal = null;
	this._canvasForMosaique = null;
	this._ctxForOriginal = null;
	this._ctxForMosaique = null;

	this._imageBySrc = {};
	this._loadedCount = 0;

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
}
inherits(MosaiqueComponent, UIComponent);

MosaiqueComponent.prototype.loadFrom = function (originalImagePath, pieceCsvPath) {
	let self = this;
	new FileListLoader([
		{
			name: pieceCsvPath,
			responseType: 'text',
			action: function (text) {
				WaitComponent.open('Loading images ...');
				self.imageFileList(MC.CharacterSeparatedValues.parse(text).filter(function (imageFile) {
					return imageFile.src != ""
				}));
				MediaFileLoader.instance().maxLoadingCount(1000);
				self.loadImagesFromFiles(function () {
					self.currentImageFile({
						src: originalImagePath
					});
					self.draw();
					WaitComponent.close();
				});
			}
		}
	]).load();
};
MosaiqueComponent.prototype.requestFiles = function () {
	let dialog = new UIComponent(),
		self = this,
		originalImageWasLoaded = false,
		csvFileWasLoaded = false;
	dialog.component().className = 'MosaiqueComponent FileDialog';
	let originalImageFileInput = new FileInputArea(function (file) {
		originalImageFileInput.removeComponent();
		let originalImageSrc = 'originalImageFile',
			originalImage = new Image(),
			reader = new FileReader();
		originalImage.onload = function () {
			originalImageWasLoaded = true;
			if (originalImageWasLoaded && csvFileWasLoaded) {
				dialog.removeComponent();
				self.draw();
			}
		};
		reader.onload = function () {
			self.currentImageFile({
				src: originalImageSrc
			});
			self._imageBySrc[originalImageSrc] = originalImage;
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
				return imageFile.src != "";
			}));
			MediaFileLoader.instance().maxLoadingCount(1000);
			WaitComponent.open('Loading images ...');
			self.loadImagesFromFiles(function () {
				WaitComponent.close();
				csvFileWasLoaded = true;
				if (originalImageWasLoaded && csvFileWasLoaded) {
					dialog.removeComponent();
					self.draw();
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
		this._pixelSize = {
			width: 1920,
			height: 1920
		};
	}
	return this._pixelSize;
};
MosaiqueComponent.prototype.currentImageFile = function (file) {
	if (file) {
		this._currentImageFile = file;
	}
	return this._currentImageFile;
};
MosaiqueComponent.prototype.imageFileList = function (list) {
	if (list) {
		this._imageFileList = list;
	}
	return this._imageFileList;
};

MosaiqueComponent.prototype.canvasComponents = function () {
	if (!this._canvasComponents) {
		this._canvasComponents = [new CanvasComponent(), new CanvasComponent()]
	}
	return this._canvasComponents;
};
MosaiqueComponent.prototype.cssClassName = function () {
	return 'MosaiqueComponent';
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
MosaiqueComponent.prototype.initializeComponent = function () {
	UIComponent.prototype.initializeComponent.call(this);
	window.addEventListener('keyup', function (evt) {
		if (evt.ctrlKey && evt.key == ',') {
			toggleSetting();
		}
	});
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

	function toggleSetting() {
		if (settingComponent) {
			settingComponent.removeComponent();
			settingComponent = null;
		} else {
			openSetting();
		}
	}

	function openSetting() {
		if (settingComponent) {
			return;
		}
		settingComponent = new UIComponent();
		settingComponent.component().classList.add('setting');
		settingComponent.appendTo(self.component());

		dividesOfOriginal = new InputNumberComponent('divides/original', self.dividesOriginal(), 1, '', function (num) {
			return Math.max(1, Math.min(1000, parseInt(num)));
		}, function () {
			self.dividesOriginal(dividesOfOriginal.value());
		});
		dividesOfOriginal.appendTo(settingComponent.component());

		let dividesOfMatching = new InputNumberComponent('divides/matching', self.divides(), 1, '', function (num) {
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
		}, self.backgroundColorOfOriginal() == 'white' ? 0 : 1, function (profile) {
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
		}, ['backgroundWhite', 'backgroundBlack', 'backgroundOriginal'].indexOf(self.backgroundOfMosaique()), function (profile) {
			self.backgroundOfMosaique(profile.name);
		});
		backgroundOfMosaiqueSwitch.appendTo(settingComponent.component());
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
		canvasComponent.canvasSize({
			width: rect.width,
			height: rect.width
		});
	});

	this.draw();
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

MosaiqueComponent.prototype.standbyOriginalImageAndMosaiqueImage = function (readyOriginalImageAction, readyMosaiqueImageAction) {
	let startTime = new Date().getTime(),
		self = this;
	this.loadImage(this.currentImageFile().src, function (image) {
		self.drawOriginal(image);
		let time = new Date().getTime();
		readyOriginalImageAction(startTime, time - startTime);
		setTimeout(function () {
			self.createMosaique();
			self.drawMosaique();
			readyMosaiqueImageAction(startTime, new Date().getTime() - time);
		}, 100);
	});
};
MosaiqueComponent.prototype.loadImagesFromFiles = function (finishedAction) {
	let self = this,
		pieceSize = this.pieceSize();
	this.imageFileList().forEach(function (imageFile) {
		let image = new Image();
		MediaFileLoader.instance().addMediaFile(imageFile.src, 'image', function (image, url) {
			meanColorsWithImage(image, url, pieceSize.width, pieceSize.height, self.divides());
			self._loadedCount += 1;
			WaitComponent.message('Loading images ... ' + self._loadedCount + '/' + (self.imageFileList().length));
		}, image);
		self._imageBySrc[imageFile.src] = image;
	});
	MediaFileLoader.instance().resume(finishedAction);
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

	image = new Image();
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
	let self = this,
		foundPieces = {},
		pieceSize = this.pieceSize(),
		divideRectsOfOriginalImage = createRectArray(this.dividesOriginal(), this.dividesOriginal(), pieceSize.width, pieceSize.height);
	divideRectsOfOriginalImage = this.sortRects().call(this, this.ctxForOriginal(), divideRectsOfOriginalImage);

	this.mosaiquePieces(divideRectsOfOriginalImage.map(function (rect, findingIndex) {
		let medianColors = meanColorsWithContext(self.ctxForOriginal(), rect.x, rect.y, rect.width, rect.height, self.divides()),
			isTranceparent = isTranceparentColors(medianColors),
			similarImageFile = isTranceparent ? null : self.findSimilarImageFileWithImageData(self.imageFileList(), medianColors, rect.width, rect.height, self.drawWithUniquePieces() ? foundPieces : null),
			displayImage = similarImageFile ? self._imageBySrc[similarImageFile.src] : null;

		if (similarImageFile) {
			foundPieces[similarImageFile.src] = similarImageFile;
		}

		let piece = {
			src: similarImageFile ? similarImageFile.src : null,
			image: displayImage,
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
			findingOrder: findingIndex
		};

		return piece;
	}));
};
MosaiqueComponent.prototype.sortRects = function (action) {
	if (action) {
		this._sortRects = action;
		this.createMosaique();
		this.drawMosaique();
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
		self = this;
	imageFileList.forEach(function (imageFile) {
		let src = imageFile.src;
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
		this.drawMosaique();
	}
	if (!this._backgroundOfMosaique) {
		this._backgroundOfMosaique = 'backgroundWhite';
	}
	return this._backgroundOfMosaique;
};
MosaiqueComponent.prototype.backgroundColorOfOriginal = function (color) {
	if (color) {
		this._backgroundColorOfOriginal = color;
		if (this.currentImageFile()) {
			let self = this;
			this.loadImage(this.currentImageFile().src, function (image) {
				self.drawOriginal(image);
				self.createMosaique();
				self.drawMosaique();
			});
		}
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
		this.createMosaique();
		this.drawMosaique();
	}
	return this._drawWithUniquePieces;
};
MosaiqueComponent.prototype.cutOverflowingPieces = function (aBoolean) {
	if (aBoolean !== undefined) {
		this._cutOverflowingPieces = aBoolean;
		if (this.currentImageFile()) {
			let self = this;
			this.loadImage(this.currentImageFile().src, function (image) {
				self.drawOriginal(image);
				self.createMosaique();
				self.drawMosaique();
			});
		}
	}
	return this._cutOverflowingPieces;
};
MosaiqueComponent.prototype.thresholdDistance = function (num) {
	if (num !== undefined) {
		this._thresholdDistance = num;
		this.createMosaique();
		this.drawMosaique();
	}
	return this._thresholdDistance;
};
MosaiqueComponent.prototype.divides = function (num) {
	if (num !== undefined) {
		this._divides = num;
		this.draw();
	}
	return this._divides;
};
MosaiqueComponent.prototype.dividesOriginal = function (num) {
	if (num !== undefined) {
		this._dividesOriginal = num;
		this.createMosaique();
		this.drawMosaique();
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
	this.standbyOriginalImageAndMosaiqueImage(function (startTime, measureTime) {}, function (startTime, measureTime) {});
}
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
			drawImageFitOn(self.ctxForMosaique(), piece.image, piece.x, piece.y, piece.width, piece.height);
		}
	});
};
