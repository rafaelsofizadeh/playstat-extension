function playlistUrlMatch() {
    let url = window.location.href;
    if (url.indexOf("youtube") !== -1 && url.indexOf("&list=") !== -1) {
        return true;
    }

    return false;
}

function sendMessage(message, callback) {
    chrome.runtime.sendMessage(message, function (response) {
        if (callback !== undefined) {
            callback();
        }
    });
}

function updatePlaylist() {
    if (playlistUrlMatch()) {
        sendMessage({ purpose: "update" });
    }
}

function connectToBackground() {
    //By default (manifesto matches) fires when match is detected, so no need for playlistUrlMatch()
    sendMessage({ purpose: "connect", apiKey: apiKey }, updatePlaylist);
}

connectToBackground();
window.addEventListener("yt-navigate-start", updatePlaylist);