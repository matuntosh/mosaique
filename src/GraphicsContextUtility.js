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

function meanColorsWithContext(ctx, ox, oy, width, height, divides) {
	let cols = divides,
		rows = divides,
		stridex = width / cols,
		stridey = height / rows,
		i, j,
		x, y,
		meanColors = [];
	for (i = 0; i < rows; i += 1) {
		y = oy + i * stridey;
		for (j = 0; j < cols; j += 1) {
			x = ox + j * stridex;
			let imageData = ctx.getImageData(x, y, stridex, stridey),
				meanColor = meanOfImageData(imageData);
			meanColor.forEach(function (val) {
				meanColors.push(val);
			});
		}
	}
	return meanColors;
}

function medianColorsWithContext(ctx, ox, oy, width, height) {
	let cols = divides,
		rows = divides,
		stridex = width / cols,
		stridey = height / rows,
		i, j,
		x, y,
		medianColors = [];
	for (i = 0; i < rows; i += 1) {
		y = oy + i * stridey;
		for (j = 0; j < cols; j += 1) {
			x = ox + j * stridex;
			let imageData = ctx.getImageData(x, y, stridex, stridey),
				centerColor = medianOfImageData(imageData);
			centerColor.forEach(function (val) {
				medianColors.push(val);
			});
		}
	}
	return medianColors;
}

function isTranceparentColors(pixelArray) {
	let i = 0,
		result = false;
	for (i = 3; i < pixelArray.length; i += 4) {
		result = result || (pixelArray[i] == 0);
	}
	return result;
}

function distanceOfPixels(array1, array2) {
	let sum = 0,
		index = 0,
		diff = null;
	for (index = 0; index < array1.length; index += 1) {
		diff = array1[index] - array2[index];
		sum += diff * diff;
	}
	return Math.sqrt(sum);
}

function meanOfImageData(imageData) {
	return meanOfPixels(imageData.data);
}

function meanOfPixels(array) {
	let mean = [0, 0, 0, 0],
		i = 0,
		count = 0;
	for (i = 0; i < array.length; i += 4) {
		mean[0] += array[i + 0];
		mean[1] += array[i + 1];
		mean[2] += array[i + 2];
		mean[3] += array[i + 3];
		count += 1;
	}
	mean.forEach(function (val, i) {
		mean[i] /= count;
	});
	return mean;
}

function medianOfImageData(imageData) {
	return medianPixel(imageData.data, imageData.width, imageData.height);
}

function medianPixel(pixelArray, width, height) {
	let pixel = [0, 0, 0, 0],
		indices = null,
		i = null;
	if ((width % 2) == 0) {
		let x1 = width / 2,
			x2 = x1 + 1;
		if ((height % 2) == 0) {
			let y1 = height / 2,
				y2 = y1 + 1,
				px1 = (y1 * width + x1) * 4,
				px2 = (y1 * width + x2) * 4,
				px3 = (y2 * width + x1) * 4,
				px4 = (y2 * width + x2) * 4;
			indices = [px1, px2, px3, px4];
		} else {
			let y = (height + 1) / 2,
				px1 = (y * width + x1) * 4,
				px2 = (y * width + x2) * 4;
			indices = [px1, px2];
		}
	} else {
		let x = (width + 1) / 2;
		if ((height % 2) == 0) {
			let y1 = height / 2,
				y2 = y1 + 1,
				px1 = (y1 * width + x) * 4,
				px2 = (y2 * width + x) * 4,
				indices = [px1, px2];
		} else {
			let y = (height + 1) / 2,
				px = (y * width + x) * 4;
			indices = [px];
		}
	}

	indices.forEach(function (index) {
		for (i = 0; i < 4; i += 1) {
			pixel[i] += pixelArray[index + i];
		}
	});
	pixel.forEach(function (val, valIndex) {
		pixel[valIndex] /= indices.length;
	});

	return pixel;
}

function grayscaleArrayOn(ctx, rect) {
	let pixelArray = ctx.getImageData(rect.x, rect.y, rect.width, rect.height).data,
		i = null,
		r = null,
		g = null,
		b = null,
		grayscaleArray = [];
	for (i = 0; i < pixelArray.length; i += 4) {
		r = pixelArray[i + 0];
		g = pixelArray[i + 1];
		b = pixelArray[i + 2];
		grayscaleArray.push(Color.Grayscale(r, g, b));
	}
	return grayscaleArray;
}

function imageContextWithImage(image, width, height) {
	let canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d');
	canvas.width = width;
	canvas.height = height;
	ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
	return ctx;
}

let meanColorsBySrc = {};

function meanColorsWithImage(image, src, imageWidth, imageHeight, divides) {
	let meanColors = meanColorsBySrc[src];
	if (!meanColors) {
		let ctx = imageContextWithImage(image, imageWidth, imageHeight),
			cols = divides,
			rows = divides,
			stridex = imageWidth / cols,
			stridey = imageHeight / rows,
			i, j,
			x, y;
		meanColors = [];
		for (i = 0; i < rows; i += 1) {
			y = i * stridey;
			for (j = 0; j < cols; j += 1) {
				x = j * stridex;
				let imageData = ctx.getImageData(x, y, stridex, stridey),
					meanColor = meanOfImageData(imageData);
				meanColor.forEach(function (val) {
					meanColors.push(val);
				});
			}
		}
		meanColorsBySrc[src] = meanColors;
	}
	return meanColors;
}

function drawImageFitOn(ctx, image, x, y, width, height) {
	let aspect = image.width / image.height,
		displayWidth = width,
		displayHeight = displayWidth / aspect;
	if (displayHeight > height) {
		displayHeight = height;
		displayWidth = displayHeight * aspect;
	}
	let displayX = (width - displayWidth) / 2 + x,
		displayY = (height - displayHeight) / 2 + y;
	ctx.drawImage(image, 0, 0, image.width, image.height, displayX, displayY, displayWidth, displayHeight);
}
