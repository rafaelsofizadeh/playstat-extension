function loadClient(apiKey) {
    gapi.client.setApiKey(apiKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest").then(
        function () {
            console.log("GAPI client loaded for API");
        },
        function (err) {
            console.error("Error loading GAPI client for API", err);
        }
    );
}

function getPlaylistItems(playlistItemsArray, settings) {
    return gapi.client.youtube.playlistItems.list(settings).then(function (response) {
        playlistItemsArray.push(...response.result.items);

        let nextPageToken = response.result.nextPageToken;
        if (nextPageToken !== undefined) {
            settings["pageToken"] = nextPageToken;
            getPlaylistItems(playlistItemsArray, settings);
        }
        else {
            console.log(playlistItemsArray);
        }
    });
}

function initiate(playlistId, apiKey) {
    let settings = {
        "part": "contentDetails",
        "maxResults": 50,
        "playlistId": playlistId
    };

    let playlistItemsArray = [];

    loadClient(apiKey).then(function () {
        getPlaylistItems(playlistItemsArray, settings);
    });
}

function loadScript() {
    //manifest.json Google API Library load fix:
    //https://stackoverflow.com/q/18681803
    let head = document.getElementsByTagName("head")[0];
    let script = document.createElement("script");
    script.src = "api.js";
    script.type = "text/javascript";
    head.appendChild(script);
}

window.onload = function () {
    loadScript();

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log(sender.tab ? "a message from content script, from URL " + sender.tab.url : "wtf :/");

            let utilityString = "&list=";
            let playlistUrl = sender.tab.url;
            let playlistId = playlistUrl.split(utilityString)
                .pop()
                .split("&")
                .shift();

            gapi.load("client", {
                callback: function () {
                    initiate(playlistId, apiKey);
                }
            });
        }
    );
}