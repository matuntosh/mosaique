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
7. Open mosaique-selective.html with a web browser.
	1. Select 'original image file'.
	2. Select mosaique-pieces.csv file that was written at (6).
	3. Original image and mosaique image are displayed on a web brower.


### 1. Download mosaique-package.zip


[mosaique-package.zip](https://github.com/matuntosh/mosaique/raw/master/mosaique-package.zip)


### 2. Unzip mosaique-package.zip


```
unzip mosaique-package.zip

mosaique-package/mosaique-selective.html
mosaique-package/lib
```


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


### 7. Open mosaique-selective.html with a web browser.

Mac:  
`open mosaique-selective.html`

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
