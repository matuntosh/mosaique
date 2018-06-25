# mosaique

mosaique draw a mosaique image from original image with piece images that is pure JavasScript program run on web-browers.


Quick Start
===========

1. Download mosaique-package.zip
2. Unzip mosaique-package.zip
3. Open mosaique-package folder.
4. Move or copy an 'original image file' into mosaique-package folder.
5. Move or copy 'mosaique piece image files folder' into mosaique-package folder.
6. Write mosaique-pieces.csv file into mosaique-package folder.
7. Open original image file and mosaique-pieces.csv.
	1. Select 'original image file'.
	2. Select mosaique-pieces.csv file that was written at (6).
	3. Original image and mosaique image are displayed on a web brower.


### 1. Download mosaique-package.zip


[mosaique-package.zip](https://github.com/matuntosh/mosaique/raw/master/mosaique-package.zip)


### 2. Unzip mosaique-package.zip


```
unzip mosaique-package.zip

mosaique-package/mosaique-selective.html
mosaique-package/mosaique-transit.html
mosaique-package/lib
```

#### mosaique-selective.html
This program draw an original image and a mosaique image side-by-side.  
#### mosaique-transit.html
This program draw an original image. When click it, draw a mosaique image. When click mosaique piece, draw clicked original image of a piece.  
See [Use mosaique-transit](#use-mosaique-transit).

### mosaique-zoom.html
This program draw an original image. When click it, draw as mosaique image. When click mosaique piece, zomm-in clicked piece and draw original image of clicked piece. When Alt-key + click original image, zoom-out to previous mosaique image. When Alt-key + click mosaique image, draw original image of mosaique image.  
See [Use mosaique-zoom](#use-mosaique-zoom).

### 3. Open mosaique-package folder.

`cd mosaique-package`


### 4. Move or copy an 'original image file' into mosaique-package folder.

`mv /path/to/originalImageFile .`  
or  
`cp /path/to/originalImageFile .`


### 5. Move or copy 'mosaique piece image files folder' into mosaique-package folder.

`mv /path/to/mosaiquePieceImageFilesFolder .`  
or  
`cp -r /path/to/mosaiquePieceImageFilesFolder .`  
or  
`ln -s /path/to/mosaiquePieceImageFilesFolder linkName`


### 6. Write mosaique-pieces.csv file into mosaique-package folder.

```
echo 'src' > mosaique-pieces.csv
ls mosaiquePieceImageFilesFolder/* >> mosaique-pieces.csv
```


### 7. Open original image file and mosaique-pieces.csv.

You need to enable local file access to web browser.  
See [Enable local file access to web browser.](#enable-local-file-access-to-web-browser)

	1. Select 'original image file'.
	2. Select mosaique-pieces.csv file that was written at (6).
	3. Original image and mosaique image are displayed on a web brower.


Example
=======

### Draw mosaique from Mona Lisa with favicons.

#### Download original image: Mona Lisa.  

Download from [Mona Lisa - Wikipedia](https://en.wikipedia.org/wiki/Mona_Lisa) into mosaique-package folder.

#### Download mosaique piece images: 5klogos.

Download LLD-icon_sample.zip from [LLD - Large Logo Dataset](https://data.vision.ee.ethz.ch/sagea/lld/) into mosaique-package folder.  
Unzip LLD-icon_sample.zip and created 5klogos folder.

#### Write mosaique-pieces.csv file.

```
echo 'src' > mosaique-pieces.csv
ls 5klogos/* >> mosaique-pieces.csv
```

#### Open mosaique-selective.html with web browser.

Select original image file -> downloaded image file.  
Select mosaique piece csv file -> wrote mosaique-pieces.csv file.



## Use mosaique-transit

This program draw an original image that is first item of image-file-list.csv.  
When click original image, draw mosaique image of clicked.  
When click piece of mosaique, draw clicked original image.  
When Alt-Key + click original image, back to previous mosaique image.  
When Alt-Key + click mosaique image, back to it original image.

image-file-list.csv is pair list of original image file path and piece image file path.  
Like this:

```
osrc,src
/path/to/originalimage1,/path/to/pieceimage1
/path/to/originalimage2,/path/to/pieceimage2
```

If you have image files then write image-file-list.csv by 4 steps.

1. Create piece images.
2. Write original-image-list.csv file.
3. Write piece-image-list.csv file.
4. Write image-file-list.csv with 'original-image-list.csv' with 'piece-image-list.csv'.

Or if use same image files for original image and mosaique piece images (like 5klogos.csv) then change srcKeys property of MosaiqueComponent. See [Change srcKeys](#change-srckeys).

### 1. Create piece images.

Create piece images same name of original images into another folder of original images.  
It's recommended to create PNG format small images about 64x64 scale.

### 2. Write original-image-list.csv file.

```
echo osrc > original-image-list.csv
find /path/to/original-image-file-folder -type f -print0 | xargs -0 ls | sort -f >> original-image-list.csv
```

### 3. Write piece-image-list.csv file.

```
echo src > piece-image-list.csv
find /path/to/piece-image-file-folder -type f -print0 | xargs -0 ls | sort -f >> piece-image-list.csv
```

### 4. Write image-file-list.csv with 'original-image-list.csv' with 'piece-image-list.csv'.

```
paste -d , original-image-list.csv piece-image-list.csv > image-file-list.csv
```

Open mosaique-transit.html and select written image-file-list.csv file.  
Draw first item of image-file-list.csv.  

When click original image, draw mosaique image of clicked.  
When click piece of mosaique, draw clicked original image.  
When Alt-Key + click original image, back to previous mosaique image.  
When Alt-Key + click mosaique image, back to it original image.


## Change srcKeys

1. Open mosaique-transit.html with text editor.
2. Add 4 lines like this:
```
		let mosaiqueComponent = new TransitOriginalMosaiqueComponent();
		mosaiqueComponent.srcKeys({
			mosaiqueSrc: 'src',
			originalSrc: 'src'
		})
		mosaiqueComponent.appendTo(document.body);
		mosaiqueComponent.requestFile();
```
'src' is column name of your image-file-list.csv.  
mosaiqueSrc key represent image file path for mosaique piece images.  
originalSrc key represent image file path for original images.


## Use mosaique-zoom

This program draw an original image that is first item of image-file-list.csv.  
When click it, draw a mosaique image. When click mosaique piece, zomm-in clicked piece and draw original image of clicked piece.  
When Alt-key + click original image, zoom-out to previous mosaique image.  
When Alt-key + click mosaique image, draw original image of mosaique image.  

1. Create piece images.
2. Write original-image-list.csv file.
3. Write piece-image-list.csv file.
4. Write image-file-list.csv with 'original-image-list.csv' with 'piece-image-list.csv'.  

This 4 steps is same as "Use mosaique-transit".  
See [Use mosaique-transit](#use-mosaique-transit).  

Open mosaique-zoom.html and select written image-file-list.csv file.  


## Enable local file access to web browser.

This program get image data from canvas to draw mosaique.  
And run web browser with disabling Local File Restrictions option.

#### Mac + Safari

`open -a Safari`

	1. Open 'Menu -> Safari -> Preferences'.
	2. Select 'Advanced Tab'.
	3. Check on 'Show Develop menu in menu bar'.
	4. Check on 'Menu -> Develop -> Disable Local File Restrictions'.

`open -a Safari mosaique-selective.html`

#### Mac + Chrome

`open -a "Google Chrome" --args --allow-file-access-from-files`

#### Mac + Firefox

open mosaique-selective.html with Firefox normally.  

`open -a Firefox`


#### Windows + Chrome

```
start chrome.exe --allow-file-access-from-files
```

Open (CTRL+O) mosaique-selective.html file on Chrome.


#### Windows + Firefox

Open mosaique-selective.html with Firefox normally.


#### Brackets Live Preview

If you use Brackets then use Brackets Live Preview.
[Brackets](http://brackets.io/)
	
	1. Open mosaique-package folder with Brackets.
	2. Select mosaique-selective.html in File Tree area.
	3. Check on 'Menu -> File -> Live Preview'.
