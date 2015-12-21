
var SynScrob = function(){
	var _this = this;
	var sessionKey;
	var authToken;
	var sessionPollTries = 0;

	this.log = function(msg){
		if(console){console.log(msg);}
	};
	
	this.showKey = function(){
		alert(_this.sessionKey);
	};
	
	this.setupUI = function(){
		this.log('setting up ui');
		if(!_this.sessionKey){
			this.log('no sessionkey');
			_this.getAuthLink();
			
		}else{
			$('#sessionKey').text(_this.sessionKey);
			$('#urlsettingPanel').show();
			//$('#sessioninfopanel').show();
		}
		
		$('#diskstationUrl').val(localStorage['diskstationUrl']);
	};
	
	this.getAuthToken = function(callback){
		$.getJSON('http://synologyscrobbler.apphb.com/GetAuthToken',function(result){
			_this.authToken=result.token;
			callback(result.url);
		});
	};
	
	
	this.getSessionKey = function(callback){
		$.getJSON('http://synologyscrobbler.apphb.com/GetSessionKey/'+_this.authToken,function(result){
			localStorage['lastFmSession']=result.sessionKey;
			_this.sessionKey=result.sessionKey;
			callback(result.sessionKey);
		});
	};
	
	this.getAuthLink = function(){
		$('#spinner').show();
		_this.getAuthToken(function(url){
			$('#authenticateLink').attr('href',url).show();//.text(url).show();
			$('#authenticatepanel').show();
			$('#spinner').hide();

		});
	};
	
	this.authenticationComplete = function(){
		//$("#authenticationcompletepanel").show();	
		$("#authenticatepanel").hide();
		$("#urlsettingPanel").show();
	};
	
	this.pollForSessionKey = function(){
		_this.log('poll for session');
		if(_this.sessionPollTries>30){
			_this.log('too many tries at getting the session. It will not succeed');
		}
		if(_this.sessionKey){
			_this.authenticationComplete();
			return;			
		}
		_this.getSessionKey(function(result){
			if(_this.sessionKey){
				_this.authenticationComplete();
				return;
			}
			_this.sessionPollTries = _this.sessionPollTries + 1 ;
			setTimeout(_this.pollForSessionKey,3000);
		});		
	};
	
	this.setupDomListeners = function(){
		$('#btnAuthenticate').click(function(){
			_this.log('authenticating');
			// get auth token
		});	

		$('#btnResetData').click(function(){
			localStorage.clear('lastFmSession');
			delete _this.sessionKey;
		});

		$("#authenticateLink").click(function(){
			_this.pollForSessionKey();
			
		});

		$('#btnGetSession').click(function(){
			_this.getSessionKey(function(session){
				_this.log('saving session '+session);
				localStorage['lastFmSession']=session;
			});
		});

		$('#btnSaveSettings').click(function(){
			_this.log('saving settings');
			var url = $('#diskstationUrl').val();
			localStorage["diskstationUrl"] = url;  
		
			var status= $('#status');
			status.html('Options Saved');
			setTimeout(function(){status.html('');},750);
		});
	};
	
	this.initialize = function(){
		_this.sessionKey = localStorage['lastFmSession'];
		_this.diskstationUrl = localStorage['diskstationUrl'];
		_this.setupDomListeners();
	};
	
	_this.initialize();
};
$(function(){
	var s = new SynScrob();
	s.setupUI();
});
