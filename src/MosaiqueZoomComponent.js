/*

The MIT License (MIT)

Copyright (c) Sun Jun 24 2018 Software Research Associates, Inc.

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

function MosaiqueZoomComponent () {
	TransitOriginalMosaiqueComponent.call(this);
	this._zoomingTime = 1000;
	this._zoomAnimation = null;
}
inherits(MosaiqueZoomComponent, TransitOriginalMosaiqueComponent);
MosaiqueZoomComponent.prototype.cssClassName = function () {
	return 'UIComponent MosaiqueComponent';
};

MosaiqueZoomComponent.prototype.stateDisplayZoomin = 'stateDisplayZoomin';
MosaiqueZoomComponent.prototype.stateDisplayZoomout = 'stateDisplayZoomout';
MosaiqueZoomComponent.prototype.zoomingTime = function (time) {
	if (time != undefined) {
		this._zoomingTime = time;
	}
	return this._zoomingTime;
};

MosaiqueZoomComponent.prototype.displayOriginal = function (endAction) {
	if (this.displayHistory().length == 0) {
		TransitOriginalMosaiqueComponent.prototype.displayOriginal.call(this, endAction);
		return;
	}

	let self = this,
		changeStateDirectionNone = function () {
			self.stateDirection(self.stateDirectionNone);
			self.stateDisplay(self.stateDisplayOriginal);
			endAction();
		};

	if (this.stateDirection() == this.stateDirectionForward) {
		let pixelSize = this.pixelSize(),
			fromRect = {x: 0, y: 0, width: pixelSize.width, height: pixelSize.height},
			partRect = this.currentImageFile(),
			toPartRect = fromRect,
			toRect = scaleRectFromRectToRect(fromRect, partRect, toPartRect),
			images = [this.canvasForMosaique(), this.canvasForOriginal()],
			froms = [fromRect, partRect],
			tos = [toRect, toPartRect],
			zoomTime = this.zoomingTime() * this.animationTimeWeight();
		this.stateDisplay(this.stateDisplayZoomin);
		this.zoom(images, froms, tos, zoomTime, function () {
			self.displayImageOnDisplay(self.canvasForOriginal(), changeStateDirectionNone);
		});
	} else {
		TransitOriginalMosaiqueComponent.prototype.displayOriginal.call(this, changeStateDirectionNone);
	}
};
MosaiqueZoomComponent.prototype.displayMosaique = function (endAction) {
	let self = this,
		changeStateDirectionNone = function () {
			self.stateDirection(self.stateDirectionNone);
			self.stateDisplay(self.stateDisplayMosaique);
			endAction();
		};

	if (this.stateDirection() == this.stateDirectionBackward) {
		let pixelSize = this.pixelSize(),
			fromRect = {x: 0, y: 0, width: pixelSize.width, height: pixelSize.height},
			previousPiece = this.previousImageFile(),
			partRect = previousPiece,
			toPartRect = fromRect,
			toRect = scaleRectFromRectToRect(fromRect, partRect, toPartRect),
			self = this,
			images = [this.canvasForMosaique(), previousPiece.cachedImage],
			froms = [toRect, toPartRect],
			tos = [fromRect, partRect],
			zoomTime = this.zoomingTime() * this.animationTimeWeight();
		this.stateDisplay(this.stateDisplayZoomout);
		this.zoom(images, froms, tos, zoomTime, function () {
			self.displayImageOnDisplay(self.canvasForMosaique(), changeStateDirectionNone);
			previousPiece.cachedImage = null;
		});
	} else {
		TransitOriginalMosaiqueComponent.prototype.displayMosaique.call(this, changeStateDirectionNone);
	}
};

MosaiqueZoomComponent.prototype.zoom = function (images, froms, tos, zoomTime, endAction) {
	if (this._zoomAnimation) {
		return;
	}
	let startTime = new Date().getTime(),
		ctx = this.displayCanvas().getContext('2d'),
		pixelSize = this.pixelSize(),
		durationTime = zoomTime,
		self = this,
		animationInfo = {
			startTime: startTime,
			durationTime: durationTime,
			fromGeometories: froms,
			toGeometories: tos,
			images: images,
			deltaFunction: EasingFunctions.linear,
			step: function (info) {
				ctx.clearRect(0, 0, pixelSize.width, pixelSize.height);
				info.fromGeometories.forEach(function (from, geometoryIndex) {
					let to = info.toGeometories[geometoryIndex],
						d = info.delta,
						vector = {x: to.x - from.x, y: to.y - from.y},
						origin = {x: from.x + vector.x * d, y: from.y + vector.y * d},
						width = (to.width - from.width) * d + from.width,
						height = (to.height - from.height) * d + from.height,
						image = info.images[geometoryIndex];
					ctx.drawImage(image, 0, 0, image.width, image.height, Math.floor(origin.x), Math.floor(origin.y), Math.floor(width), Math.floor(height));
				});
			},
			end: function (info) {
				self._zoomAnimation = null;
				endAction();
			},
			stop: function (info) {
				self._zoomAnimation = null;
			}
		};
	this._zoomAnimation = new Animation(animationInfo);
	this._zoomAnimation.start();
};

MosaiqueZoomComponent.prototype.mouseupAction = function (event) {
	if (this._zoomAnimation) {
		let info = this._zoomAnimation.info();
		this._zoomAnimation.stop();
		this.addWheelZoomAction(info);
		return;
	}
	TransitOriginalMosaiqueComponent.prototype.mouseupAction.call(this, event);
};
MosaiqueZoomComponent.prototype.addWheelZoomAction = function (zoomingState) {
	let self = this,
		action = function (evt) {
			evt.preventDefault();
			let weight = evt.shiftKey ? 0.00001 : 0.001,
				vector = self.stateDisplay() == self.stateDisplayZoomin ? 1 : -1,
				mv = evt.deltaY * weight * vector,
				value = mv + zoomingState.delta;
			zoomingState.delta = Math.max(0, Math.min(1, value));
			zoomingState.step(zoomingState);
			if (zoomingState.delta == 1) {
				zoomingState.end(zoomingState);
				remove();
			} else if (zoomingState.delta == 0) {
				if (self.stateDisplay() == self.stateDisplayZoomin) {
					let file = self.displayHistory().pop();
					self.currentImageFile(file);
					self.stateDirection(self.stateDirectionNone);
					self.stateDisplay(self.stateDisplayMosaique);
				} else if (self.stateDisplay() == self.stateDisplayZoomout) {
					self.displayHistory().push(self.currentImageFile());
					self.currentImageFile(self.previousImageFile());
					self.stateDirection(self.stateDirectionNone);
					self.stateDisplay(self.stateDisplayOriginal);
				}
				self.draw();
				remove();
			}
		},
		remove = function () {
			self.displayCanvas().removeEventListener('wheel', action);
		};
	this.displayCanvas().addEventListener('wheel', action);
};

MosaiqueZoomComponent.prototype.createSettingComponent = function () {
	let c = TransitOriginalMosaiqueComponent.prototype.createSettingComponent.call(this),
		self = this,
		zoomingTimeInput = new InputNumberComponent('zoom time', this.zoomingTime(), 1, 'ms', function (num) {
			return Math.max(0, parseFloat(num));
		}, function () {
			self.zoomingTime(zoomingTimeInput.value());
		});
	zoomingTimeInput.appendTo(c.component());
	return c;
};
