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
}
inherits(MosaiqueZoomComponent, TransitOriginalMosaiqueComponent);
MosaiqueZoomComponent.prototype.cssClassName = function () {
	return 'UIComponent MosaiqueComponent';
};
MosaiqueZoomComponent.prototype.zoomController = function () {
	return this.transitController();
};
MosaiqueZoomComponent.prototype.transitController = function () {
	if (!this._transitController) {
		let self = this;
		this._transitController = new ZoomController(
			this.displayCanvas(),
			function (event) {
				if (self.stateDisplay() == self.stateDisplayOriginal) {
					self.stateDisplay(self.stateDisplayMosaique);
					self.draw();
					return;
				}
				let rect = self.displayCanvas().getBoundingClientRect(),
					pixelSize = self.pixelSize(),
					point = {
						x: (event.clientX - rect.left) / rect.width * pixelSize.width,
						y: (event.clientY - rect.top) / rect.height * pixelSize.height
					};
				let piece = self.selectMosaiquePieceAtPoint(point);
				if (!piece || !piece[self.srcKeys().mosaiqueSrc]) {
					return;
				}
				self.selectNext(piece);
			},
			function (event) {
				self.backToPrevious();
			}
		);
		this._transitController.revertAction = function (info) {
			self.revertZoom();
		};
	}
	return this._transitController;
};
MosaiqueZoomComponent.prototype.revertZoom = function () {
	if (this.zoomController().stateZoom() == this.zoomController().stateZoomin) {
		let file = this.displayHistory().pop();
		this.currentImageFile(file);
		this.zoomController().stateDirection(this.zoomController().stateDirectionNone);
		this.stateDisplay(this.stateDisplayMosaique);
	} else if (this.zoomController().stateZoom() == this.zoomController().stateZoomout) {
		this.displayHistory().push(this.currentImageFile());
		this.currentImageFile(this.previousImageFile());
		this.zoomController().stateDirection(this.zoomController().stateDirectionNone);
		this.stateDisplay(this.stateDisplayOriginal);
	}
	this.draw();
};
MosaiqueZoomComponent.prototype.displayOriginal = function (endAction) {
	if (this.displayHistory().length == 0) {
		TransitOriginalMosaiqueComponent.prototype.displayOriginal.call(this, endAction);
		return;
	}

	let self = this,
		changeStateDirectionNone = function () {
			self.stateDisplay(self.stateDisplayOriginal);
            if (self.automaticTransit()) {
				self.stateDisplay(self.stateDisplayMosaique);
				self.zoomController().stateDirection(self.stateDirectionForward);
            }
			endAction();
			self._displayOriginalStartTime = new Date().getTime();
		};

	if (this.zoomController().stateDirection() == this.zoomController().stateDirectionForward) {
		this.zoomController().animationTimeWeight(this.zoomController().animationTimeWeight());
		let pixelSize = this.pixelSize(),
			fromRect = {x: 0, y: 0, width: pixelSize.width, height: pixelSize.height},
			partRect = this.currentImageFile(),
			toPartRect = fromRect,
			toRect = scaleRectFromRectToRect(fromRect, partRect, toPartRect),
			images = [this.canvasForMosaique(), this.canvasForOriginal()],
			froms = [fromRect, partRect],
			tos = [toRect, toPartRect];
		this.zoomin(images, froms, tos, function () {
			self.displayImageOnDisplay(self.canvasForOriginal(), changeStateDirectionNone);
		});
	} else {
		TransitOriginalMosaiqueComponent.prototype.displayOriginal.call(this, changeStateDirectionNone);
	}
};
MosaiqueZoomComponent.prototype.displayMosaique = function (endAction) {
	let self = this,
		changeStateDirectionNone = function () {
			self.stateDisplay(self.stateDisplayMosaique);
			endAction();
		};

	if (this.zoomController().stateDirection() == this.zoomController().stateDirectionBackward) {
		let pixelSize = this.pixelSize(),
			fromRect = {x: 0, y: 0, width: pixelSize.width, height: pixelSize.height},
			previousPiece = this.previousImageFile(),
			partRect = previousPiece,
			toPartRect = fromRect,
			toRect = scaleRectFromRectToRect(fromRect, partRect, toPartRect),
			self = this,
			images = [this.canvasForMosaique(), previousPiece.cachedImage],
			froms = [toRect, toPartRect],
			tos = [fromRect, partRect];
		this.zoomout(images, froms, tos, function () {
			self.displayImageOnDisplay(self.canvasForMosaique(), changeStateDirectionNone);
			previousPiece.cachedImage = null;
		});
	} else {
		TransitOriginalMosaiqueComponent.prototype.displayMosaique.call(this, changeStateDirectionNone);
	}
};

MosaiqueZoomComponent.prototype.zoomin = function (images, froms, tos, endAction) {
	this.zoomController().stateZoom(this.zoomController().stateZoomin);
	this.zoom(images, froms, tos, endAction);
};
MosaiqueZoomComponent.prototype.zoomout = function (images, froms, tos, endAction) {
	this.zoomController().stateZoom(this.zoomController().stateZoomout);
	this.zoom(images, froms, tos, endAction);
};
MosaiqueZoomComponent.prototype.zoom = function (images, froms, tos, endAction) {
	let ctx = this.displayCanvas().getContext('2d'),
		self = this,
		pixelSize = this.pixelSize();

	this.zoomController().transitAction = function (info) {
		ctx.clearRect(0, 0, pixelSize.width, pixelSize.height);
		froms.forEach(function (from, geometoryIndex) {
			let to = tos[geometoryIndex],
				d = info.delta,
				vector = {x: to.x - from.x, y: to.y - from.y},
				origin = {x: from.x + vector.x * d, y: from.y + vector.y * d},
				width = (to.width - from.width) * d + from.width,
				height = (to.height - from.height) * d + from.height,
				image = images[geometoryIndex];
			ctx.drawImage(image, 0, 0, image.width, image.height, Math.floor(origin.x), Math.floor(origin.y), Math.floor(width), Math.floor(height));
		});
	};
	this.zoomController().endAction = endAction;
	this.zoomController().zoom();
};

MosaiqueZoomComponent.prototype.createSettingComponent = function () {
	let c = TransitOriginalMosaiqueComponent.prototype.createSettingComponent.call(this),
		self = this,
		zoomingTimeInput = new InputNumberComponent('zoom time', this.zoomController().zoomingTime(), 1, 'ms', function (num) {
			return Math.max(0, parseFloat(num));
		}, function () {
			self.zoomController().zoomingTime(zoomingTimeInput.value());
		});
	zoomingTimeInput.appendTo(c.component());
	return c;
};
