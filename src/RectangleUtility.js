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

function createRectArray(hCount, vCount, dWidth, dHeight) {
	let ix = null,
		iy = null,
		rects = [];
	for (iy = 0; iy < vCount; iy += 1) {
		let y = iy * dHeight;
		for (ix = 0; ix < hCount; ix += 1) {
			let x = ix * dWidth;
			rects.push({
				x: x,
				y: y,
				width: dWidth,
				height: dHeight
			});
		}
	}
	return rects;
}

function scaleRectFitInRect(rect, fitInRect) {
	var scale = fitInRect.width / rect.width,
		aspect = rect.width / rect.height,
		width = fitInRect.width,
		height = width / aspect;
	if (height > fitInRect.height) {
		height = fitInRect.height;
		width = height * aspect;
	}
	var x = fitInRect.x + (fitInRect.width - width) / 2,
		y = fitInRect.y + (fitInRect.height - height) / 2;
	return {
		x: x,
		y: y,
		width: width,
		height: height
	};
}

function scaleRectFromRectToRect(rect, from, to) {
	var scale = to.width / from.width,
		fromCenter = {
			x: from.x + from.width / 2,
			y: from.y + from.height / 2
		},
		toCenter = {
			x: to.x + to.width / 2,
			y: to.y + to.height / 2
		},
		rectCenter = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2
		},
		vector = {
			x: rectCenter.x - fromCenter.x,
			y: rectCenter.y - fromCenter.y
		},
		newRectCenter = {
			x: toCenter.x + vector.x * scale,
			y: toCenter.y + vector.y * scale
		},
		width = rect.width * scale,
		height = rect.height * scale,
		x = newRectCenter.x - width / 2,
		y = newRectCenter.y - height / 2;
	return {
		x: x,
		y: y,
		width: width,
		height: height
	};
}
