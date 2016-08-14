
"use strict";

module("UTestImageCollector");

QUnit.test("ImageInfo.ctor", function (assert) {
    let imageInfo = new ImageInfo("http://www.baka-tsuki.org/WebToEpub.jpg", 0, null);
    assert.equal(imageInfo.wrappingUrl, "http://www.baka-tsuki.org/WebToEpub.jpg");
    assert.equal(imageInfo.sourceUrl, null);
    assert.equal(imageInfo.getZipHref(), "OEBPS/Images/0000_WebToEpub.jpg");
    assert.equal(imageInfo.getId(), "image0000");
});

QUnit.test("ImageInfo.findImageSuffix", function (assert) {
    let imageInfo = new ImageInfo("WebToEpub.jpg", 0, null);
    imageInfo.mediaType = "image/bmp";
    assert.equal(imageInfo.findImageSuffix("http://www.baka-tsuki.org/project/index.php?title=File:WebToEpub.jpg"), "jpg");
    assert.equal(imageInfo.findImageSuffix("https://www.baka-tsuki.org/project/thumb.php?f=WebToEpub.gif&width=427"), "gif");
    assert.equal(imageInfo.findImageSuffix("https://baka-tsuki.org/project/index.php?title=The_Unexplored_Summon_Blood_Sign:Volume1"), "bmp");
});

QUnit.test("ImageInfo.extractImageFileNameFromUrl", function (assert) {
    let imageInfo = new ImageInfo("WebToEpub.jpg", 0, null);
    assert.equal(imageInfo.extractImageFileNameFromUrl(""), undefined);
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org"), undefined);
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/"), undefined);
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/HSDxD_v01_cover.svg"), "HSDxD_v01_cover.svg");
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/HSDxD_v01_cover.svg#hash"), "HSDxD_v01_cover.svg");
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/project/index.php?HSDxD_v01_cover.jpg"), "HSDxD_v01_cover.jpg");
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/project/index.php?title=File:HSDxD_v01_cover.jpg"), "HSDxD_v01_cover.jpg");
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/project/thumb.php?f=HSDxD_v01_cover.gif&width=427"), "HSDxD_v01_cover.gif");
    assert.equal(imageInfo.extractImageFileNameFromUrl("https://www.baka-tsuki.org/project/images/7/76/HSDxD_v01_cover.jpg"), "HSDxD_v01_cover.jpg");
    assert.equal(imageInfo.extractImageFileNameFromUrl("http://sonako.wikia.com/wiki/File:Date4_000c.png"), "Date4_000c.png");
    assert.equal(imageInfo.extractImageFileNameFromUrl("http://vignette2.wikia.nocookie.net/sonako/images/d/db/Date4_000c.png/revision/latest?cb=20140821053052"), "Date4_000c.png");
    assert.equal(imageInfo.extractImageFileNameFromUrl("http://vignette2.wikia.nocookie.net/sonako/images/d/db/Date4_000c.png/revision/latest/scale-to-width-down/332?cb=20140821053052"), "Date4_000c.png");
});

QUnit.test("findImagesUsedInDocument", function (assert) {
    let dom = new DOMParser().parseFromString(
        "<x>" +
           "<ul class=\"gallery mw-gallery-traditional\">" +
               "<li class=\"gallerybox\">" +
                   "<div class=\"thumb\">" +
                       "<a href=\"https://www.baka-tsuki.org/project/index.php?title=File:BTS_vol_01_000a.jpg\" class=\"image\">" +
                            "<img src=\"https://www.baka-tsuki.org/Baka-Tsuki_files/120px-BTS_vol_01_000a.jpg\" >" +
                       "</a>" +
                   "</div>" +
               "</li>" +
               "<li class=\"comment\"></li>" +
           "</ul>" +
           "<div class=\"thumb tright\">" +
                "<a href=\"https://www.baka-tsuki.org/project/index.php?title=File:BTS_vol_01_000b.png\" class=\"image\">" +
                    "<img src=\"https://www.baka-tsuki.org/Baka-Tsuki_files/120px-BTS_vol_01_000b.png\" >" +
                "</a>" +
           "</div>" +
           "<div class=\"thumbinner\">T1</div>" +
           "<div class=\"floatright\">" +
                "<a href=\"https://www.baka-tsuki.org/project/index.php?title=File:BTS_vol_01_000a.jpg\" class=\"image\">" +
                    "<img src=\"https://www.baka-tsuki.org/Baka-Tsuki_files/120px-BTS_vol_01_000a.jpg\" >" +
                "</a>" +
           "</div>" +
           "<a href=\"https://www.baka-tsuki.org/project/index.php?title=File:BTS_vol_01_000c.jpg\" class=\"image\">" +
                "<img src=\"https://www.baka-tsuki.org/Baka-Tsuki_files/120px-BTS_vol_01_000c.jpg\" >" +
            "</a>" +
        "</x>",
        "text/html"
    );

    let imageCollector = new ImageCollector();
    imageCollector.findImagesUsedInDocument(dom.body);
    assert.equal(imageCollector.imageInfoList.length, 3);
    let imageInfo = imageCollector.imageInfoByUrl("https://www.baka-tsuki.org/project/index.php?title=File:BTS_vol_01_000a.jpg");
    assert.equal(imageInfo.getZipHref(), "OEBPS/Images/0000_BTS_vol_01_000a.jpg");

    // test adding a new cover 
    imageCollector.setCoverImageUrl("http://test.com/dummy.jpg");
    assert.equal(imageCollector.imageInfoList.length, 4);
    imageInfo = imageCollector.imagesToFetch[0];
    assert.equal(imageInfo.isCover, true);
    assert.equal(imageInfo.sourceUrl, "http://test.com/dummy.jpg");
    assert.equal(imageCollector.imagesToFetch.length, 4);

    // test making existing image the cover
    imageCollector.setCoverImageUrl("https://www.baka-tsuki.org/Baka-Tsuki_files/120px-BTS_vol_01_000b.png");
    assert.equal(imageCollector.imagesToFetch.length, 4);
    imageInfo = imageCollector.imageInfoList[1];
    assert.equal(imageInfo.sourceUrl, "https://www.baka-tsuki.org/Baka-Tsuki_files/120px-BTS_vol_01_000b.png");
    assert.equal(imageInfo.isCover, true);
});

QUnit.test("removeDuplicateImages", function (assert) {
    let imageCollector = new ImageCollector();
    // basic setup
    imageCollector.addImageInfo("http://test.com/cover.jpg", "http://test.com/cover.jpg", true);
    imageCollector.addImageInfo("http://test.com/bmp1.jpg", "http://test.com/bmp1.jpg", false);
    imageCollector.addImageInfo("http://test.com/bmp2.jpg", "http://test.com/bmp2.jpg", false);
    imageCollector.addImageInfo("http://test.com/cover.jpg", "http://test.com/cover.jpg", false);
    assert.equal(imageCollector.imagesToFetch.length, 3);
    assert.equal(imageCollector.imageInfoList.length, 3);
    assert.equal(imageCollector.imagesToPack.length, 0);
    assert.equal(imageCollector.urlIndex.get("http://test.com/bmp1.jpg"), 1);
    assert.equal(imageCollector.urlIndex.get("http://test.com/cover.jpg"), 0);
    assert.equal(imageCollector.urlIndex.get("http://test.com/bmp2.jpg"), 2);

    // now give both images same bitmap
    let imageInfoList = imageCollector.imageInfoList;
    imageInfoList[0].arraybuffer = new ArrayBuffer(4);
    imageInfoList[1].arraybuffer = new ArrayBuffer(4);
    imageCollector.addToPackList(imageInfoList[0]);
    imageCollector.addToPackList(imageInfoList[1]);

    // bmp1 URL should now point to index 0.
    assert.equal(imageCollector.urlIndex.get("http://test.com/bmp1.jpg"), 0);
    assert.equal(imageCollector.urlIndex.get("http://test.com/cover.jpg"), 0);
    assert.equal(imageCollector.urlIndex.get("http://test.com/bmp2.jpg"), 2);
    let imagesToPack = imageCollector.imagesToPack;
    assert.equal(imagesToPack.length, 1);
    assert.equal(imagesToPack[0].sourceUrl, "http://test.com/cover.jpg");

    // pack 3rd image
    imageInfoList[2].arraybuffer = new ArrayBuffer(8);
    let byteArray = new Uint8Array(imageInfoList[2].arraybuffer);
    for (let i = 0; i < byteArray.length; ++i) {
        byteArray[i] = i;
    }
    imageCollector.addToPackList(imageInfoList[2]);
    assert.equal(imagesToPack.length, 2);
    assert.equal(imagesToPack[1].sourceUrl, "http://test.com/bmp2.jpg");
    assert.equal(imageCollector.urlIndex.get("http://test.com/bmp2.jpg"), 2);
});
