(async function () {
    window.eax = {
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
        ShowList: {

        },
        tabID: null,
		isInit: false,
        lastData: null,
        ID: function () {
            if (window.eax.tabID === null) {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
                    window.eax.tabID = tab[0].id;
                });
            }
            return window.eax.tabID;
        },

        addAction: function (action, args = {}) {
			return { Action:action, tabID: window.eax.ID(), ...args };
		},

        getData: function (action = 'getTabData', arguments = {}) {
            chrome.runtime.sendMessage(
                window.eax.addAction(action, arguments),
                window.eax.Response
            );
        },

        Listener: function (info, sender, sendResponse) {
            if (info.Action !== undefined && window.eax[info.Action] !== undefined) {
                let Action = window.eax[info.Action];

				sendResponse({from: 'popup', ...sender, ...Action(info)});
            }
        },

        Update: function (info = null) {
            window.eax.lastData = info;

            window.eax.checkList();

            console.log('Update', info);
            return {};
        },

        Response: function (info) {
            if (chrome.runtime.lastError === undefined) {
                if (info.Action !== undefined && window.eax[info.Action] !== undefined) {
                    let Action = window.eax[info.Action];

                    Action(info);
                }
			}
        },

        StartFunc: function (info) {
            window.eax.lastData = info;
            
            document.querySelector("#allTabTrack").className = 'color' + (info.allTabTrack ? "On" : "Off");
            document.querySelector("#allTabTrack").innerHTML = 'Track All Tabs ' + (info.allTabTrack ? "On" : "Off");
            document.querySelector("#allTabTrack").style.display = "inline-block";
            
            document.querySelector("#tabTrack").className = 'color' + (info.tabTrack ? "On" : "Off");
            document.querySelector("#tabTrack").innerHTML = 'Track this Tab ' + (info.tabTrack ? "On" : "Off");
            document.querySelector("#tabTrack").style.display = "inline-block";

            window.eax.checkList();

            console.log('StartFunc', info);
        },

        clearNow: function (info) {
            window.eax.lastData = info;
            
            document.querySelector("#list").innerHTML = '';

            console.log('clearNow', info);
        },

        checkList: function () {
            for (let row in window.eax.lastData.tabData) {
                // console.log(row);
                //if (document.querySelector("#list #item"+row) === null) {
                if (window.eax.ShowList["item"+row] === undefined) {
                    
                    let is = window.eax.lastData.tabData[row].cm;

                    if (window.eax.names[is] !== undefined) {

                        let name = window.eax.names[is] === undefined ? is : window.eax.names[is];

                        window.eax.ShowList["item"+row] = "show";
                        let cont1 = document.createElement('div');
                        
                        cont1.id = "item"+row;
                        
                        // cont1.addEventListener('click', function (el) { window.eax.toggle("item"+row); });

                        let str = "<p onclick=\"window.eax.toggle('item"+row+"')\">" + name + ' - ' + window.eax.lastData.tabData[row].timeProcces.toFixed(3) + "s <a href='"+window.eax.lastData.tabData[row].link +
                        "&debug=1' target='_blank'> Check </a></p>" +
                        "<p id='extra'>";
                        let strObj = [];
                        for (let val in window.eax.lastData.tabData[row]) {
                            if (!['link','count','timeProcces'].includes(val)) {
                                strObj.push('<span>' + val + '</span>=<span>' +
                                    decodeURIComponent(window.eax.lastData.tabData[row][val]) + '</span>'
                                );
                            }
                        }

                        str += strObj.join('<br />') + '</p>';

                        cont1.innerHTML = str;
                        document.querySelector("#list").appendChild(cont1);

                        document.querySelector("#list #item"+ row+ " p")
                            .addEventListener('click', function (el) {
                                window.eax.toggle("item"+row);
                            });

                    } else {
                        window.eax.ShowList["item"+row] = 'hidden';
                    }
                }
            }
        },

        init: function () {
			if (!window.eax.isInit) {
                window.eax.isInit = true;

                window.eax.ID();
                window.eax.loop();
            }
        },

        loop: function () {
            if (window.eax.tabID === null) {
                setTimeout(window.eax.loop, 500);
            } else {
                chrome.runtime.onMessage.addListener(window.eax.Listener);
                window.eax.getData('getTabData');

                document.querySelector("#tabTrack").addEventListener("click", function () {
                    window.eax.eventClickToggle('tabTrack');
                });
                document.querySelector("#allTabTrack").addEventListener("click", function () {
                    window.eax.eventClickToggle('allTabTrack');
                });

                document.querySelector("#clearList").addEventListener("click", function () {
                    chrome.runtime.sendMessage(
                        window.eax.addAction("clearList"),
                        window.eax.Response
                    );
                });
            }
        },

        eventClickToggle: function (sendWho) {
            chrome.runtime.sendMessage(
                window.eax.addAction("toggle", { who:sendWho }),
                window.eax.Response
            );
        },

        toggle: function (id) {
            elm = document.querySelector("#"+ id + " #extra");
            
            document.querySelector("#"+ id + " #extra")
                .style.display =
                    elm.style.display === 'block' ?
                        'none' : 'block';
        }
    };

    window.eax.init();
} ());