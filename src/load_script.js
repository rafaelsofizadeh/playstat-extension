/*
function getVideoIds(playlistItemsArray) {
    let videoIdsArray = playlistItemsArray.map(item => {
        return item.contentDetails.videoId;
    });

    console.log("video ids: ", videoIdsArray);
    return videoIdsArray;
}
*/

function handleUpdate(url) {
    let playlistId = getPlaylistId(url);
    let settings = {
        "part": "contentDetails",
        "maxResults": 50,
        "playlistId": playlistId
    };

    return new Promise(function (resolve, reject) {
        let playlist = getPlaylistItems(settings);
        resolve(playlist);
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

function loadPlaylistItems(settings) {
    return gapi.client.youtube.playlistItems.list(settings);
}

async function getPlaylistItems(settings) {
    let playlistItems = []
    let response = await loadPlaylistItems(settings);
    let nextPageToken = response.nextPageToken;
    playlistItems.push(...response.result.items);

    while (nextPageToken !== undefined) {
        settings.pageToken = nextPageToken;
        response = await loadPlaylistItems(settings);
        playlistItems.push(...response.result.items);

        nextPageToken = response.nextPageToken;
    }

    return playlistItems;
}

//---------------------------------------------------------

function handleConnection(apiKey) {
    gapi.load("client")
    gapi.client.setApiKey(apiKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest");
}

//---------------------------------------------------------

function loadScript() {
    //manifest.json Google API Library load fix:
    //https://stackoverflow.com/q/18681803
    let head = document.getElementsByTagName("head")[0];
    let script = document.createElement("script");
    script.src = "api1.js";
    script.type = "text/javascript";
    script.onload = setMessageListener;
    head.appendChild(script);
}

function setMessageListener() {
    chrome.runtime.onMessage.addListener(
        //Handling promises inside if/else
        //https://stackoverflow.com/a/47083894
        function (request, sender, sendResponse) {
            if (request.purpose === "update") {
                handleUpdate(sender.tab.url)
                    .then(function (playlist) {
                        sendResponse(playlist);
                    });
            } else if (request.purpose === "connect") {
                handleConnection(request.apiKey)
                    .then(function () {
                        sendResponse("response to client | connect")
                    });
            }

            //sendResponse in async function
            //https://stackoverflow.com/a/20077854
            return true;
        }
    );
}

loadScript();