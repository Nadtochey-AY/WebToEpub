/*
    General dumping ground for misc functions that I can't find a better place for.
    Warning: Don't look at this too closely, or you may loose your sanity.
    Side Note: Putting these all in one place may not have been a good idea. 
    I think they're breeding. There seem to be more functions in here that I didn't create.
*/

"use strict";

var utilLocal = (function () {

    var extractProtocol = function (url) {
        let parser = document.createElement("a");
        parser.href = url;
        return parser.protocol;
    };
	
	var extractPathname = function (url) {
        let parser = document.createElement("a");
        parser.href = url;
        return parser.pathname;
    };
    
    return {
        extractProtocol: extractProtocol,
		extractPathname: extractPathname
    };
})();

