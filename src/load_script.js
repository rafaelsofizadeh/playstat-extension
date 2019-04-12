/*
function loadPlaylistItems(settings) {
    return gapi.client.youtube.playlistItems.list(settings);
}

async function getPlaylistItems(settings) {
    let playlistItems = []
    let response = (await loadPlaylistItems(settings));
    let nextPageToken = response.nextPageToken;

    while (nextPageToken !== undefined) {
        playlistItems.push(...response.items);
        settings.pageToken = nextPageToken;

        response = (await loadPlaylistItems(settings));
        nextPageToken = response.nextPageToken;
    }

    console.log(playlistItems);
    return playlistItems;
}

function getVideoIds(playlistItemsArray) {
    let videoIdsArray = playlistItemsArray.map(item => {
        return item.contentDetails.videoId;
    });

    console.log("video ids: ", videoIdsArray);
    return videoIdsArray;
}

function initiate(playlistId, apiKey) {
    let settings = {
        "part": "contentDetails",
        "maxResults": 50,
        "playlistId": playlistId
    };

    let playlistItemsArray = [];

    loadClient(apiKey).then(function () {
        getPlaylistItems(playlistItemsArray, settings).then(getVideoIds(playlistItemsArray));
    });
}

function getPlaylistId(url) {
    let utilityString = "&list=";
    let playlistUrl = url;
    let playlistId = playlistUrl.split(utilityString)
        .pop()
        .split("&")
        .shift();

    return playlistId;
}
*/
function loadScript() {
    //manifest.json Google API Library load fix:
    //https://stackoverflow.com/q/18681803
    let head = document.getElementsByTagName("head")[0];
    let script = document.createElement("script");
    script.src = "api.js";
    script.type = "text/javascript";
    head.appendChild(script);
}

function handleUpdate() {
    console.log("update requested");
}

function handleConnection(apiKey) {
    return gapi.load("client", {
        callback: function () {
            loadClient(apiKey);
            console.log("connection requested");
        }
    });

}

function loadClient(apiKey) {
    gapi.client.setApiKey(apiKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function () {
            console.log("GAPI client loaded for API");
        })
        .catch(function (err) {
            console.error("Error loading GAPI client for API", err);
        });
}

window.onload = function () {
    loadScript();

    chrome.runtime.onMessage.addListener(
        //Handling promises inside if/else
        //https://stackoverflow.com/a/47083894
        async function (request, sender, sendResponse) {
            if (request.purpose === "update") {
                await handleUpdate(sender.tab.url);
                sendResponse("response to client | update");
            } else if (request.purpose === "connect") {
                await handleConnection(request.apiKey);
                sendResponse("response to client | connect");
            }

            //let playlistId = getPlaylistId(sender.tab.url);
        }
    );
}