//---------------------------------------------------------
// Use results to update DOM

function getElementByXPath(xpath) {
    return new XPathEvaluator()
        .createExpression(xpath)
        .evaluate(document, XPathResult.FIRST_ORDERED_NODE_TYPE)
        .singleNodeValue;
}

function insertPlaylistDuration(duration) {
    let destination = getElementByXPath("//*[@id=\"publisher-container\"]");
    let durationString = duration.hours + "h. "
        + duration.minutes + "min. "
        + duration.seconds + "s. ";

    let durationElement = document.createElement("div");
    durationElement.className = "index-message-wrapper style-scope ytd-playlist-panel-renderer";
    durationElement.style.marginLeft = "auto";
    durationElement.innerHTML = durationString;

    destination.appendChild(durationElement);
}

//---------------------------------------------------------
// Connection and navigation update

function playlistUrlMatch() {
    let url = window.location.href;
    if (url.indexOf("youtube") !== -1 && url.indexOf("&list=") !== -1) {
        return true;
    }

    return false;
}

function sendMessage(message, callback) {
    chrome.runtime.sendMessage(message, function (response) {
        if (response.purpose === "update") {
            insertPlaylistDuration(response.result);
            console.log(response);
        }

        if (response.purpose === "connect") {
            console.log(response.result);
        }

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

window.onload = function () {
    connectToBackground();
    window.addEventListener("yt-navigate-start", updatePlaylist);
}