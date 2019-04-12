function playlistUrlMatch() {
    let url = window.location.href;
    if (url.indexOf("youtube") !== -1 && url.indexOf("&list=") !== -1) {
        return true;
    }

    return false;
}

function sendMessage() {
    chrome.runtime.sendMessage({ apiKey: apiKey }, function (response) {
        console.log(response);
    });
}

function messageControl() {
    if (playlistUrlMatch()) {
        sendMessage();
    }
}

sendMessage();
window.addEventListener("yt-navigate-start", messageControl);