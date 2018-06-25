/*

The MIT License (MIT)

Copyright (c) Thu Jun 21 2018 Software Research Associates, Inc.

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

function TransitOriginalMosaiqueComponent () {
	MosaiqueComponent.call(this);
	this._displayCanvas = null;
	this._displayHistory = [];
    this._stateDisplay = null;
	this._stateDirection = null;
	this._automaticTransit = false;
	this._transitDurationTime = 1000;
}
inherits(TransitOriginalMosaiqueComponent, MosaiqueComponent);

TransitOriginalMosaiqueComponent.prototype.requestFile = function () {
	let dialog = new UIComponent(),
		self = this,
		srcKey = this.srcKeys().mosaiqueSrc,
		osrcKey = this.srcKeys().originalSrc;
	dialog.component().className = 'MosaiqueComponent FileDialog';
	let mosaiqueCsvFileInput = new FileInputArea(function (file) {
		mosaiqueCsvFileInput.removeComponent();
		let reader = new FileReader();
		reader.onload = function () {
			let imageFileList = MC.CharacterSeparatedValues.parse(reader.result).filter(function (imageFile) {
				return imageFile[srcKey] != "" && imageFile[osrcKey] != "";
			});
			self.imageFileList(imageFileList, function () {
				dialog.removeComponent();
				self.currentImageFile(imageFileList[0]);
			});
		};
		reader.readAsText(file);
	}, 'mosaique and original path csv file');
	mosaiqueCsvFileInput.appendTo(dialog.component());
	dialog.appendTo(this.component());
};
TransitOriginalMosaiqueComponent.prototype.defaultSrcKeys = {
	originalSrc: 'osrc',
	mosaiqueSrc: 'src'
};
TransitOriginalMosaiqueComponent.prototype.automaticTransit = function (aBoolean) {
	if (aBoolean !== undefined) {
		this._automaticTransit = aBoolean;
	}
	return this._automaticTransit;
};
TransitOriginalMosaiqueComponent.prototype.transitDurationTime = function (time) {
	if (time !== undefined) {
		this._transitDurationTime = time;
	}
	return this._transitDurationTime;
};
TransitOriginalMosaiqueComponent.prototype.stateDisplayOriginal = 'stateDisplayOriginal';
TransitOriginalMosaiqueComponent.prototype.stateDisplayMosaique = 'stateDisplayMosaique';
TransitOriginalMosaiqueComponent.prototype.stateDisplayTransit = 'stateDisplayTransit';
TransitOriginalMosaiqueComponent.prototype.stateDisplay = function (state) {
    if (state) {
        this._stateDisplay = state;
    }
    if (!this._stateDisplay) {
        this._stateDisplay = this.stateDisplayOriginal;
    }
    return this._stateDisplay;
};
TransitOriginalMosaiqueComponent.prototype.stateDirectionForward = 'stateDirectionForward';
TransitOriginalMosaiqueComponent.prototype.stateDirectionBackward = 'stateDirectionBackward';
TransitOriginalMosaiqueComponent.prototype.stateDirectionNone = 'stateDirectionNone';
TransitOriginalMosaiqueComponent.prototype.stateDirection = function (state) {
	if (state) {
		this._stateDirection = state;
	}
	if (!this._stateDirection) {
		this._stateDirection = this.stateDirectionNone;
	}
	return this._stateDirection;
};

TransitOriginalMosaiqueComponent.prototype.displayCanvas = function () {
	if (!this._displayCanvas) {
		this._displayCanvas = document.createElement('canvas');
        this._displayCanvas.className = 'displayCanvas';
		let self = this;
        this._displayCanvas.addEventListener('mouseup', function (evt) {
			self.mouseupAction(evt);
		});
	}
	return this._displayCanvas;
};
TransitOriginalMosaiqueComponent.prototype.displayHistory = function () {
	return this._displayHistory;
};
TransitOriginalMosaiqueComponent.prototype.cssClassName = function () {
	return 'UIComponent MosaiqueComponent';
};
TransitOriginalMosaiqueComponent.prototype.createComponent = function () {
	this.canvasComponents().splice(1, 1);
	this.canvasComponents()[0].addCanvas(this.canvasForMosaique());
	this.canvasComponents()[0].addCanvas(this.displayCanvas());
	return MosaiqueComponent.prototype.createComponent.call(this);
};
TransitOriginalMosaiqueComponent.prototype.mouseupAction = function (event) {
	if (event.altKey) {
		this.backToPrevious();
		return;
	}

	if (this.stateDisplay() == this.stateDisplayOriginal) {
        this.stateDisplay(this.stateDisplayMosaique);
		this.stateDirection(this.stateDirectionForward);
        this.draw();
		return;
	}

	let rect = this.displayCanvas().getBoundingClientRect(),
		pixelSize = this.pixelSize(),
		point = {
			x: (event.clientX - rect.left) / rect.width * pixelSize.width,
			y: (event.clientY - rect.top) / rect.height * pixelSize.height
		};
	let piece = this.selectMosaiquePieceAtPoint(point);
	if (!piece || !piece[this.srcKeys().mosaiqueSrc]) {
		return;
	}
	this.selectNext(piece);
};

TransitOriginalMosaiqueComponent.prototype.displayOriginal = function (endAction) {
	let original = this.canvasForOriginal(),
		self = this,
		changeStateDirectionNone = function () {
			self.stateDirection(self.stateDirectionNone);
			endAction();
		};
	if (this.transitDurationTime() > 0 && this.stateDirection() != this.stateDirectionNone) {
		this.transitImage(this.canvasForMosaique(), original, this.transitDurationTime(), changeStateDirectionNone);
		return;
	}
	this.displayImageOnDisplay(original, changeStateDirectionNone);
};
TransitOriginalMosaiqueComponent.prototype.displayMosaique = function (endAction) {
	let mosaique = this.canvasForMosaique(),
		self = this,
		changeStateDirectionNone = function () {
			self.stateDirection(self.stateDirectionNone);
			endAction();
		};
	if (this.transitDurationTime() > 0 && this.stateDirection() != this.stateDirectionNone) {
		this.transitImage(this.canvasForOriginal(), mosaique, this.transitDurationTime(), changeStateDirectionNone);
		return;
	}
	this.displayImageOnDisplay(mosaique, changeStateDirectionNone);
};
TransitOriginalMosaiqueComponent.prototype.displayImageOnDisplay = function (image, endAction) {
	let ctx = this.displayCanvas().getContext('2d');
	ctx.clearRect(0, 0, image.width, image.height);
	ctx.drawImage(image, 0, 0, image.width, image.height);
	endAction();
};
TransitOriginalMosaiqueComponent.prototype.transitImage = function (fromImage, toImage, displayTime, endAction) {
	let animationEasingFunction = 'linear',
		ctx = this.displayCanvas().getContext('2d'),
		self = this,
		pixelSize = this.pixelSize();
	return setTimeout(function () {
		new Animation({
			startTime: new Date().getTime(),
			durationTime: displayTime,
			fromGeometories: [1, 0],
			toGeometories: [0, 1],
			images: [fromImage, toImage],
			deltaFunction: EasingFunctions[animationEasingFunction],
			step: function (info) {
				ctx.clearRect(0, 0, pixelSize.width, pixelSize.height);
				info.fromGeometories.forEach(function (from, geometoryIndex) {
					let to = info.toGeometories[geometoryIndex],
						d = info.delta,
						vector = to - from,
						alpha = from + vector * d,
						image = info.images[geometoryIndex];
					ctx.save();
					ctx.globalAlpha = alpha;
					ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, pixelSize.width, pixelSize.height);
//					self.stateDisplay(self.stateDisplayTransit);
				});
			},
			stop: endAction
		}).start();
	}, 100);
};
TransitOriginalMosaiqueComponent.prototype.draw = function () {
	if (!this.currentImageFile()) {
		return;
	}
	let self = this;
	this.standbyOriginalImageAndMosaiqueImage(function(startTime, measureTime, endAction) {
        if (self.stateDisplay() == self.stateDisplayOriginal) {
            self.displayOriginal(endAction);
            if (self.automaticTransit()) {
				let waitTime = 6000,
					delayTime = waitTime - measureTime;
				if (delayTime <= 0) {
					self.stateDisplay(self.stateDisplayMosaique);
					self.draw();
				} else {
					setTimeout(function () {
						self.stateDisplay(self.stateDisplayMosaique);
						self.draw();
					}, delayTime);
				}
            }
        } else {
			endAction();
		}
	}, function (startTime, measureTime, endAction) {
		if (self.stateDisplay() == self.stateDisplayMosaique) {
			self.displayMosaique(endAction);
		} else {
			endAction();
		}
	});
};

// selecting
TransitOriginalMosaiqueComponent.prototype.selectMosaiquePieceAtPoint = function (point) {
    for (var i = 0; i < this.mosaiquePieces().length; i += 1) {
        let piece = this.mosaiquePieces()[i];
        if (piece.x <= point.x && point.x <= piece.x + piece.width && piece.y <= point.y && point.y <= piece.y + piece.height) {
            return piece;
        }
    }
    return null;
};
TransitOriginalMosaiqueComponent.prototype.selectNext = function (file) {
	if (this.currentImageFile()) {
		this.currentImageFile().mosaiquePieces = this.mosaiquePieces();
		this.displayHistory().push(this.currentImageFile());
	}
    this.stateDisplay(this.stateDisplayOriginal);
	this.stateDirection(this.stateDirectionForward);
	this.currentImageFile(file);
};
TransitOriginalMosaiqueComponent.prototype.backToPrevious = function () {
	if (this.stateDisplay() == this.stateDisplayMosaique) {
        this.stateDisplay(this.stateDisplayOriginal);
		this.stateDirection(this.stateDirectionBackward);
		this.currentImageFile(this.currentImageFile());
	} else {
        if (this.displayHistory().length <= 0) {
            return;
        }
        this.stateDisplay(this.stateDisplayMosaique);
		this.stateDirection(this.stateDirectionBackward);
		let file = this.displayHistory().pop();
		this.currentImageFile(file);
	}
};

TransitOriginalMosaiqueComponent.prototype.createSettingComponent = function () {
	let c = MosaiqueComponent.prototype.createSettingComponent.call(this),
		self = this,
		automaticTransitSwitch = new SwitchComponent('automatic transit', this.automaticTransit(), function (s) {
			self.automaticTransit(s.on());
		}),
		transitDurationTimeInput = new InputNumberComponent('transit time', this.transitDurationTime(), 1, 'ms', function (num) {
			return Math.max(0, parseFloat(num));
		}, function () {
			self.transitDurationTime(transitDurationTimeInput.value());
		});
	automaticTransitSwitch.appendTo(c.component());
	transitDurationTimeInput.appendTo(c.component());
	return c;
};
