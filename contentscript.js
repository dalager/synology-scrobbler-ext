var lastSong;
var lastMiniPosition;
var lastStandardPosition;
var isSubmitting = false;
var isUsingMiniPlayer = false;

function log(msg){
	var logEnabled = false;
	if(logEnabled && console.log){
		console.log(msg);	
	}
}

function logError(msg){
	var errorLogEnabled = false;
	if(logEnabled && console.log){
		console.log(msg);	
	}
}

function getSpannedDataItem(id){
    var el = document.getElementById(id);
    if(el){
	    var spans = el.getElementsByTagName('span');
	    if(spans && spans[0]){
	    	return spans[0].innerHTML;	    	
	    }else{
	    	var divs = el.getElementsByTagName('div');
	    	if(divs && divs[0]){
	    		log(divs[0]);
	    		return divs[0].innerHTML;
	    	}
	    }
    }
    return null;
}
function getSpannedDataItemByClass(className){
    var el = document.getElementsByClassName(className);
    if(el && el.length>0){
        var spans = el[0].getElementsByTagName('span');
        if(spans && spans[0]){
            return spans[0].innerHTML;
        }else{
            var divs = el[0].getElementsByTagName('div');
            if(divs && divs[0]){
                return divs[0].innerHTML;
            }
        }
    }
    return null;
}

function getSpannedByClass(className){
    var el = document.getElementsByClassName(className);
    log(el);
    if(el && el.length>0){
        return el[0].innerHTML;
    }
    return '';
}

function getDivedDataItem(id){
    var el = document.getElementById(id);
	if(el){
    	var sp = el.getElementsByTagName('div')[0];
    	if(sp)	{
    		return sp.innerHTML;    		
    	}
	}
    return null;
}


function getPosition(){
	var el = document.getElementById('player_position');
	if(el){
		return el.innerHTML;
	}
	return null;
}
function getPositionMini(){
	var el = document.getElementById('miniplayer_position');
	if(el){
		return el.innerHTML;
	}
	return null;
}



function get3xInfo(){
    var song = {};
    checkMiniPlayerInUse();
    if(isUsingMiniPlayer == true){
        song.artist = getSpannedDataItem('player_artist');
        song.track = getSpannedDataItem('miniplayer_title');
        song.album = getSpannedDataItem('miniplayer_album');
        song.position = getPositionMini();
    }else{
        song.artist = getSpannedDataItem('player_artist');
        song.track = getSpannedDataItem('player_title');
        song.album = getSpannedDataItem('player_album');
        song.position = getPosition();
    }
    return song;
}

function get4xInfo(){
    var song = {};

    var albumArtist = getSpannedDataItemByClass('info-album-artist');
    if(albumArtist){
        var albumArtistArray = albumArtist.split(' - ');
        song.artist  = albumArtistArray.pop();
        song.album=albumArtistArray.join(' - ');
    }
    song.track = getSpannedDataItemByClass('info-title');
    song.position = getSpannedByClass('info-position');
    return song;
}
/*
 * This function, get Song Information from miniPlayer or StandardPlayer pane depending of if
 * mini player is in use.
 */


function getAsVersion(){
    if(document.getElementsByClassName('syno-as-win').length>0){
        return "4.x";
    }else{
        return "3.x";
    }
}

function getSongInfo() {
    var song;

    // detect AS version.

    var as_version =getAsVersion();


    log('AudioStation version: '+as_version);

    switch (as_version) {
        case '3.x':
            song = get3xInfo();
            break;
        case '4.x':
            song = get4xInfo();
            break;
        default:
            song = get3xInfo();
            break;
    }

    log('song:');
    log(song);
    return song;
}


/**
 * Checks if user is using miniPlayer comparing miniplayer_position with lastMiniPosition and
 * player_position with lastStandardPosition
 */
function checkMiniPlayerInUse(){
	
	var actualMiniPosition  = getPositionMini();
	var actualStandardPosition = getPosition();
	if(isUsingMiniPlayer === true){
		if(lastStandardPosition && actualStandardPosition && (actualStandardPosition !== lastStandardPosition)){
			isUsingMiniPlayer = false;
			log("Changing from MiniPlayer to Standard");
		} 
	}else{
		if(lastMiniPosition && actualMiniPosition && (lastMiniPosition !== actualMiniPosition)){
			isUsingMiniPlayer = true;
			log("Changing from Standard to Mini");
		}
	}
	lastStandardPosition = actualStandardPosition;
	lastMiniPosition = actualMiniPosition;
}

function checkLastFmSession(callback){
	chrome.extension.sendMessage({'method': "getSession"}, function(response) {
		log('Session:');
		log(response.lastFmSession);
		callback(response.lastFmSession!=='' && response.lastFmSession !== undefined);
	});
}

function pollForSong() {
	log('pollForSong');
    var song = getSongInfo();
	if(song.position==null || song.artist==null||song.track==null){
		log('not playing')
	}else if (!song.position.match(/\d{1,2}\:\d\d/)) {
        log('position suggests not playing ' + song.position);
    }
    else if (lastSong && lastSong.Track == song.track) {
        log('already submitted');
    } else {
        log("Submitting song ");
        log(song);
        if(!isSubmitting && !(lastSong && lastSong.Track == song.track)){
	        isSubmitting=true;
        	submitSong(song, function (data) {
	            if(data && data.Success && data.Success===false){
					log(data.Message);
				}
				lastSong = data.SongInfo;
	            isSubmitting=false;
	        });
    	}
    }
    setTimeout(pollForSong, 1200);
}

function submitSong(songInfo, callback){
	chrome.extension.sendMessage({'method': "submitSongInfo",'songInfo': songInfo}, function(response) {
		callback(response);
		log('Response:');
		log(response);
	});
}

//Communication to plugin's background thread
chrome.extension.sendMessage({method: "getUrl"}, function(response) {
  // get the url to work with
  log("url in settings: "+response.url);
  log("serverUrl: "+response.serverUrl);
  log("this url: "+location.href);
  if(response.url && response.url !== '' && location.href.match(response.url)){
	log('Start polling the player');
	checkLastFmSession(function(authenticated){
		if(authenticated){
			pollForSong();
		}
		else{
			log('not authenticated');
		}
	});
  }else{
	log("Not our url, don't poll the player");
  }
});