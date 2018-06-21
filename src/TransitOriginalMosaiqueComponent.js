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
	this._automaticTransit = false;
    this._stateDisplay = null;
}
inherits(TransitOriginalMosaiqueComponent, MosaiqueComponent);

TransitOriginalMosaiqueComponent.prototype.automaticTransit = function (aBoolean) {
	if (aBoolean !== undefined) {
		this._automaticTransit = aBoolean;
	}
	return this._automaticTransit;
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
	if (!piece) {
		return;
	}
	this.selectNext({src: piece.src});
};

TransitOriginalMosaiqueComponent.prototype.displayOriginal = function () {
	let original = this.canvasForOriginal(),
		ctx = this.displayCanvas().getContext('2d');
	ctx.clearRect(0, 0, original.width, original.height);
	ctx.drawImage(original, 0, 0, original.width, original.height);
};
TransitOriginalMosaiqueComponent.prototype.displayMosaique = function () {
	let mosaique = this.canvasForMosaique(),
		ctx = this.displayCanvas().getContext('2d');
	ctx.drawImage(mosaique, 0, 0, mosaique.width, mosaique.height);
};
TransitOriginalMosaiqueComponent.prototype.draw = function () {
	if (!this.currentImageFile()) {
		return;
	}
	let self = this;
	this.standbyOriginalImageAndMosaiqueImage(function() {
        if (self.stateDisplay() == self.stateDisplayOriginal) {
            self.displayOriginal();
            if (self.automaticTransit()) {
                self.stateDisplay(self.stateDisplayMosaique);
                self.draw();
            }
        }
	}, function () {
		if (self.stateDisplay() == self.stateDisplayMosaique) {
			self.displayMosaique();
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
	this.currentImageFile(file);
};
TransitOriginalMosaiqueComponent.prototype.backToPrevious = function () {
	if (this.stateDisplay() == this.stateDisplayMosaique) {
        this.stateDisplay(this.stateDisplayOriginal);
		this.currentImageFile(this.currentImageFile());
	} else {
        if (this.displayHistory().length <= 0) {
            return;
        }
        this.stateDisplay(this.stateDisplayMosaique);
		let file = this.displayHistory().pop();
		this.currentImageFile(file);
	}
};
