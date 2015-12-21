function serializeObject (obj) {
	    var str = [];
	    for (var p in obj)
	        str.push(p + "=" + encodeURIComponent(obj[p]));
	    return str.join("&");
}
var lastSong;
// var serverUrl =  'http://localhost:50349/submitsong';
var serverUrl =  'http://synologyscrobbler.apphb.com/submitsong';

//var serverUrl= 'http://localhost:50349/submitsong';

function submitSong(songInfo,callback) {
	var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (data) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                callback(data);
            } else {
                callback(null);
            }
        }
    }
	console.log('loggable');
    xhr.open('POST', serverUrl, true);
    songInfo.SessionKey=localStorage['lastFmSession'];
    var params = serializeObject(songInfo);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(params);
}

chrome.extension.onMessage.addListener(function(request, sender, callback) {
    console.log(request);
	if (request.method === "getUrl"){
		console.log('getUrl');
		console.log('returning: '+localStorage['diskstationUrl']);
	  	callback({url: localStorage['diskstationUrl'], 'serverUrl': serverUrl});
    }else if(request.method==='getSession'){
    	console.log('getSession:');
    	console.log(localStorage['lastFmSession']);
		callback({'lastFmSession':localStorage['lastFmSession']});
	}
    else if(request.method ==="submitSongInfo"){
    	console.log('submitSongInfo');
    	submitSong(request.songInfo,callback)	    	
    }else{
    	callback({}); // snub them.	
    }
    return true;	  
});

console.log('loaded page');