"use strict";

function makeScreenshot() {
    let el = document.querySelector("#screenshot-frame"),
        elStyle = getComputedStyle(el),
        options = {
            /*
            The element that contains the graph has `position: fixed` set with `top: 60px`.
            This option ensures, that the image content won't overflow to the bottom.
            */
            scrollY: -1 * parseInt(elStyle.top),
        },
        now = new Date(),
        timestamp = "" + now.getFullYear() +
            ("00" + (now.getMonth() + 1)).slice(-2) +
            ("00" + now.getDate()).slice(-2) + "-" +
            ("00" + now.getHours()).slice(-2) + 
            ("00" + now.getMinutes()).slice(-2) + 
            ("00" + now.getSeconds()).slice(-2),
        defaultFilename = $(".log-filename").text().replace(".", "_") + "-" 
            + timestamp + ".png";
    html2canvas(el, options).then(canvas => {
        window.canv = canvas;
        let anchor = document.createElement("a");
        anchor.download = defaultFilename;
        anchor.href = canvas.toDataURL();
        anchor.click();
    });
}