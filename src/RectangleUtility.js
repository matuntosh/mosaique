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
