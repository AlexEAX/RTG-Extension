(async function () {

	chrome.eax = {
		names: {
            send_product:'Send Product Event',
            send_category:'Send Category Event',
            //time_on_site:'Time On Site',
            //time_spent:'Time Spent',
            //page_scroll: 'Scroll Event',
            add_to_cart: 'AddToCart Event',
            remove_from_cart: 'RemoveFromCart Event',
            over_add_to_cart: 'Over AddToCart Event',
            set_last_url: 'Set Last URL',
            set_cart_url: 'Set Cart URL',
            set_email: 'Set Email',
            over_price: 'Mouse over Price',
            save_order:'Save Order Event',
            send_brand:'Send Brand Event'
        },
		eventLimit: 50,
		setLocal: ['allTabTrack', 'tabs', 'count'],
		allTabTrack: true,
		tabs: {},
		isInit: false,
		count: 0,
		addAction: function (action, args = {}) {
			return { Action:action, ...args, allTabTrack: chrome.eax.allTabTrack};
		},

		checkTab: function (tabID) {
			if (chrome.eax.tabs['tab' + tabID] === undefined) {
				chrome.eax.tabs['tab' + tabID] = {
					tabID: tabID,
					tabData: [],
					tabTrack: chrome.eax.allTabTrack,
					tabUpdate: true
				};
			}
		},

		toggle: function (info) {
			if (info.who === 'allTabTrack') {
				chrome.eax[info.who] = !chrome.eax[info.who];
			} else {
				chrome.eax.tabs['tab' + info.tabID][info.who] =
					!chrome.eax.tabs['tab' + info.tabID][info.who];
			}
			
			chrome.eax.updateStorage();
			return chrome.eax.addAction("StartFunc", chrome.eax.tabs['tab' + info.tabID])
		},
		updateStorage: function () {
			let send = {};

			for (let el of chrome.eax.setLocal) {
				send[el] = chrome.eax[el];
			}

			chrome.storage.local.set(send)
		},
		clearList: function (info) {
			chrome.eax.tabs['tab' + info.tabID].tabData = [];
			chrome.eax.count = 0;

			chrome.action.setBadgeText({
				text: '',
				tabId : info.tabID
			});
			

			chrome.action.setBadgeBackgroundColor({
				tabId: info.tabID,
				color: "#6BB933",
			});

			chrome.eax.updateStorage();

			return chrome.eax.addAction("clearNow", chrome.eax.tabs['tab' + info.tabID])
		},

		getTabData: function (info) {
			let tabID = info.tabID;

			chrome.eax.tabID = info.tabID;

			chrome.eax.checkTab(tabID);

			chrome.eax.tabs['tab' + tabID].tabUpdate = true;

			let bage = chrome.eax.tabs['tab' + tabID].tabData.length;

			chrome.action.setBadgeText({
				text: '' + (bage === 0 ? '' : bage),
				tabId : tabID
			});

			chrome.action.setBadgeBackgroundColor({
				tabId: tabID,
				color: "#6BB933",
			});
			
			chrome.eax.updateStorage();
			return chrome.eax.addAction("StartFunc", chrome.eax.tabs['tab' + tabID]);
		},

		Listener: function (info, sender, sendResponse) {
			if (info.Action !== undefined && chrome.eax[info.Action] !== undefined) {
				let Action = chrome.eax[info.Action];

				sendResponse({from: 'backgound', ...sender, ...Action(info)});

				// console.log('Listener', info, sender, sendResponse);
			}
		},

		Response: function (info) {
			if (chrome.runtime.lastError === undefined) {
				if (info.Action !== undefined && chrome.eax[info.Action] !== undefined) {
					let Action = chrome.eax[info.Action];

					Action(info);
					//console.log('Response', info);
				}
			}
		},

		sendMessage: function (action = 'Update', argument = {}) {
			
			chrome.runtime.sendMessage(
				chrome.eax.addAction(action, argument),
				chrome.eax.Response
			);
		},
		urlData: function(url){
			let newSplit = url.split('?')[1];
			let sendData = {};
			for (let str of newSplit.split('&')) {
				str = chrome.eax.splitData(str,'=',1);
				sendData[str[0]] = str[1];
			}
			return sendData;
		},

		splitData: function (str, separator, limit) {
			str = str.split(separator);
			return str.length > limit ? [
				str.splice(0, limit),
				str.join(separator)
			] : str;
		},
		
		trackNetwork: function (info) {
			let tabID = info.tabId;
			console.log(info);
			
			chrome.eax.tabID = info.tabId;

			if (tabID !== -1 && chrome.eax.allTabTrack) {
				chrome.eax.checkTab(tabID);
			}
			
			if (chrome.eax.tabs['tab' + tabID] !== undefined) {
				if (chrome.eax.tabs['tab' + tabID].tabTrack) {

					let find = info.url.match(/ra\.ev.+?cm=(.*?)&/);
					if (find) {
						if (chrome.eax.tabs['tab' + tabID].tabData.length > chrome.eax.eventLimit) {
							chrome.eax.tabs['tab' + tabID].tabData = chrome.eax.tabs['tab' + tabID].tabData.slice(-5);	
						}
						if (chrome.eax.names[find[1]] !== undefined) {
						
							let proc = (Date.now() - info.timeStamp);
							proc = proc < 0 ? 0 : proc;
							
							let URLData = chrome.eax.urlData(info.url);
							URLData.link = info.url;
							URLData.count = chrome.eax.count;
							URLData.timeProcces = proc;

							chrome.eax.tabs['tab' + tabID].tabData.push(URLData);

							if (chrome.eax.tabs['tab' + tabID].tabUpdate) {
								chrome.eax.sendMessage('Update', chrome.eax.tabs['tab' + tabID]);
							}

							chrome.eax.count++;
						
							let bage = chrome.eax.tabs['tab' + tabID].tabData.length;
							chrome.action.setBadgeText({
								text: '' + (bage === 0 ? '' : bage),
								tabId : tabID
							});
	
							chrome.action.setBadgeBackgroundColor({
								tabId: tabID,
								color: "#6BB933",
							});

							chrome.eax.updateStorage();
						}
					}
				}
			}
		},
		start: function () {
            chrome.eax.isLoad = true;

            chrome.storage.local.get(chrome.eax.setLocal, function(info) {
				for (let el of chrome.eax.setLocal) {
					chrome.eax[el] =
						info[el] !== undefined ?
							info[el] : chrome.eax[el];
				}
            });

			chrome.webRequest.onCompleted.addListener(
				chrome.eax.trackNetwork,
				{ urls: ["<all_urls>"] }
			);

			chrome.runtime.onMessage.addListener(chrome.eax.Listener)

        },

        init: function () {
            chrome.eax.isLoad ? null : chrome.eax.start();
        }
	};
	
	chrome.eax.init();

})();