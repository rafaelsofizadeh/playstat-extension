//---------------------------------------------------------
// Getting any results related to playlists

function handleUpdate(url) {
    let playlistId = getPlaylistId(url);
    let settings = {
        playlistItems: {
            "part": "contentDetails",
            "maxResults": 50,
            "playlistId": playlistId
        },
        videos: {
            "part": "contentDetails"
        }
    };

    return new Promise(function (resolve, reject) {
        getVideoItemsDetails(settings)
            .then(function (videoItemsDetails) {
                let playlistDuration = getPlaylistDuration(videoItemsDetails);
                resolve(playlistDuration);
            });
    });
}

//---------------------------------------------------------
// Getting playlistItem results
//---------------------------------------------------------

function getPlaylistId(url) {
    let utilityString = "&list=";
    let playlistUrl = url;
    let playlistId = playlistUrl.split(utilityString)
        .pop()
        .split("&")
        .shift();

    return playlistId;
}

function loadPlaylistItems(playlistItemsSettings) {
    return gapi.client.youtube.playlistItems.list(playlistItemsSettings);
}

async function getPlaylistItems(playlistItemsSettings) {
    let playlistItems = []
    let response = await loadPlaylistItems(playlistItemsSettings);
    let nextPageToken = response.result.nextPageToken;
    playlistItems.push(...response.result.items);

    while (nextPageToken !== undefined) {
        playlistItemsSettings["pageToken"] = nextPageToken;
        response = await loadPlaylistItems(playlistItemsSettings);
        playlistItems.push(...response.result.items);

        nextPageToken = response.nextPageToken;
    }

    return playlistItems;
}

//---------------------------------------------------------
// Getting video results from playlistItems
//---------------------------------------------------------

function getVideoIds(playlistItems) {
    let videoIdsArray = playlistItems.map(item => {
        return item.contentDetails.videoId;
    });

    return videoIdsArray;
}

function arrayToList(array) {
    return array.join();
}

function prepareVideosSettings(videosSettings, playlistItems) {
    let videoIdsArray = getVideoIds(playlistItems);
    let videoList = arrayToList(videoIdsArray);

    videosSettings.id = videoList;

    return videosSettings;
}

async function getVideoItemsDetails(settings) {
    let playlistItems = await getPlaylistItems(settings.playlistItems);
    let videoItemsDetails = [];

    for (let i = 0; i < playlistItems.length / 50; i++) {
        let playlistItemsBatch = playlistItems.slice(i * 50, (i + 1) * 50);
        let videosSettings = prepareVideosSettings(settings.videos, playlistItemsBatch);
        let videoResponse = await gapi.client.youtube.videos.list(videosSettings);
        videoItemsDetails.push(...videoResponse.result.items);
    }

    return videoItemsDetails;
}

//---------------------------------------------------------
// Using video results
//---------------------------------------------------------

function parseDuration(iso8601Duration) {
    let iso8601DurationRegex = /PT(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;
    let matches = iso8601Duration.match(iso8601DurationRegex);

    return {
        hours: matches[1] === undefined ? 0 : parseInt(matches[1]),
        minutes: matches[2] === undefined ? 0 : parseInt(matches[2]),
        seconds: matches[3] === undefined ? 0 : parseInt(matches[3])
    };
}

function getPlaylistDuration(videoItemsDetails) {
    console.log("videoItemsDetails: ", videoItemsDetails);
    let durationTotalInSeconds = videoItemsDetails
        .map(videoItem => parseDuration(videoItem.contentDetails.duration))
        .reduce((totalDuration, videoItemDuration) => {
            console.log("totalDuration: " + totalDuration, "videoItemDuration: ", videoItemDuration);
            totalDuration += videoItemDuration.hours * 3600
                + videoItemDuration.minutes * 60
                + videoItemDuration.seconds;

            return totalDuration;
        }, 0);

    let durationHours = Math.floor(durationTotalInSeconds / 3600);
    let durationMinutes = Math.floor((durationTotalInSeconds - durationHours * 3600) / 60);
    let durationSeconds = durationTotalInSeconds - durationHours * 3600 - durationMinutes * 60;

    return {
        hours: durationHours,
        minutes: durationMinutes,
        seconds: durationSeconds
    };
}

//---------------------------------------------------------
// Establishing connection

function handleConnection(apiKey) {
    gapi.load("client")
    gapi.client.setApiKey(apiKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest");
}

//---------------------------------------------------------
// Starter code

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
                    .then(function (playlistDuration) {
                        sendResponse({
                            purpose: "update",
                            result: playlistDuration
                        });
                    });
            } else if (request.purpose === "connect") {
                handleConnection(request.apiKey)
                    .then(function () {
                        sendResponse({
                            purpose: "connect",
                            result: "successfully connected!"
                        });
                    });
            }

            //sendResponse in async function
            //https://stackoverflow.com/a/20077854
            return true;
        }
    );
}

loadScript();
