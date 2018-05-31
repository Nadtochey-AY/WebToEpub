/*
  parses lnmtl.com
*/
"use strict";

//parserFactory.register("lnmtl.com", function() { return new LnmtlParser() });

var urlGlobal;

parserFactory.registerRule(
    // return probability (0.0 to 1.0) web page is a Blogspot page
    function(url, dom) {
		urlGlobal=url;
		
        return ((util.extractHostName(url).indexOf("translate.ru") != -1) &&
            ((url.indexOf("lnmtl.com") != -1) || (url.indexOf("a2ip.ru") != -1))) ||
			(util.extractHostName(url).indexOf("lnmtl.com") != -1) ||
			(util.extractHostName(url).indexOf("a2ip.ru") != -1);
    },
    function() { return new LnmtlParser() }
);

/*
parserFactory.registerManualSelect(
    "LNMTL", 
    function() { return new LnmtlParser() }
);
*/

class LnmtlParser extends Parser {
    constructor() {
        super();
    }

    getChapterUrls(dom) {
        let volumesList = LnmtlParser.findVolumesList(dom);
        if (volumesList.length !== 0) {
            return LnmtlParser.fetchChapterLists(volumesList, HttpClient.fetchJson).then(function (lists) {
                return LnmtlParser.mergeChapterLists(lists); 
            });
        };

        let table = dom.querySelector("#volumes-container table");
        return Promise.resolve(util.hyperlinksToChapterList(table));
    }

    extractTitle(dom) {
        let title = dom.querySelector("meta[property='og:title']");
        return (title === null) ? super.extractTitle(dom) : title.getAttribute("content");
    }

    findContent(dom) {
        return dom.querySelector("div.chapter-body");
    }

	/*
    findChapterTitle(dom) {
        return dom.querySelector("h3.dashhead-title");
    }
	*/

    customRawDomToContentStep(chapter, content) {
		for(let s of content.querySelectorAll("dq")) {
            let i = s.ownerDocument.createElement("i");
            let b = s.ownerDocument.createElement("b");
			s.parentNode.insertBefore(i, s);
			i.appendChild(s);
			i.parentNode.insertBefore(b, i);
			b.appendChild(i);
        }
		
        for(let s of content.querySelectorAll("sentence")) {
            if (s.className === "original") {
				let br = s.ownerDocument.createElement("br");
				s.replaceWith(br);
                //s.remove();
            } else {
				/*
                let p = s.ownerDocument.createElement("p");
                p.innerText = s.innerText;
                s.replaceWith(p);
				*/
			}
        }
    }

    findCoverImageUrl(dom) {
        return util.getFirstImgSrc(dom, "div.jumbotron.novel");
    }

    static findVolumesList(dom) {
        let startString = "lnmtl.volumes = ";
        let scriptElement = util.getElement(dom, "script", e => 0 <= e.textContent.indexOf(startString));
        if (scriptElement !== null) {
            return util.locateAndExtractJson(scriptElement.textContent, startString);
        }
        return []; 
    }

    static fetchChapterLists(volumesList, fetchJson) {
        return Promise.all(
            volumesList.map(volume => LnmtlParser.fetchChapterListsForVolume(volume, fetchJson))
        );
    }

    static fetchChapterListsForVolume(volumeInfo, fetchJson) {
        let restUrl = LnmtlParser.makeChapterListUrl(volumeInfo.id, 1);
        return fetchJson(restUrl).then(function (handler) {
            let firstPage = handler.json;
            let pagesForVolume = [Promise.resolve(handler)];
            for( let i = 2; i <= firstPage.last_page; ++i) {
                let url = LnmtlParser.makeChapterListUrl(volumeInfo.id, i);
                pagesForVolume.push(fetchJson(url));
            };
            return Promise.all(pagesForVolume);
        })
    }

    static makeChapterListUrl(volumeId, page) {
		return `http://lnmtl.com/chapter?page=${page}&volumeId=${volumeId}`;
		
		return `http://lnmtl.com/chapter?page=${page}&volumeId=${volumeId}`;
    }

    static mergeChapterLists(lists) {
        let chapters = [];
        for(let list of lists) {
            for (let page of list) {
                for(let chapter of page.json.data) {
                    chapters.push({
                        //sourceUrl: chapter.site_url,
                        sourceUrl: LnmtlParser.translate() + LnmtlParser.prHost() + utilLocal.extractPathname(chapter.site_url),
                        title: "#" + chapter.number + ": " + chapter.title,
                        newArc: null                    
                    });
                };
            };
        };
        return chapters;
    }
	
	static translate() {
        return utilLocal.extractProtocol(urlGlobal)+'//www.translate.ru/SiteResult.aspx?dirCode=er&templateId=general&url=';
    }
	
	static prHost() {
        return utilLocal.extractProtocol(urlGlobal) + '//' + util.extractHostName(urlGlobal);
    }
}