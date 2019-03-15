import JSZip from 'jszip';

function component() {
    let element = document.createElement('div');

    element.innerHTML = "<div><label for=\"save\">Choose a save to remove ironman:</label>\n"/* +
        "\n" +
        "<input type=\"file\"\n" +
        "       id=\"save\" name=\"save\"\n" +
        "       accept=\".ck2\"></div>";*/

    let input = document.createElement("input");
    input.name = "save";
    input.accept = ".ck2";
    input.type = "file";
    input.addEventListener('input', updateValue);
    input.addEventListener('change', updateValue);
    element.appendChild(input);

    // const input = document.querySelector('#save');

    // input.addEventListener('input', updateValue);

    async function updateValue(e) {

        // console.log("upload:", e.target.files);
        const files = e.target.files;
        const file = files[0];

        const zipped = await readFile(file);
        const unzipped = await unzip(zipped);
        const filename = getFilename(unzipped);
        const withoutIronMan = await removeIronManFlags(unzipped);
        // console.log("new unzipped:", unzipped);
        const reZipped = await reZip(withoutIronMan, filename);

    }

    function readFile(file) {
        const reader = new FileReader();
        const promise = new Promise((resolve, reject) => {
            reader.onload = e => {
                resolve(e.target.result);
            }
        });
        reader.readAsBinaryString(file);
        return promise;
    }

    function unzip(zipped) {
        const zip = new JSZip();

        const promise = new Promise((resolve, reject) => {
            zip.loadAsync(zipped)
                .then(async unzipped => {
                    let result = {};
                    for (var key in unzipped.files) {
                        const file = unzipped.files[key];
                        console.log("file:", key);
                        const content = await file.async("string");
                        console.log("content length:", content.length);
                        // console.log("content:", content);
                        result[key] = content;
                    }
                    resolve(result);
                })
        });
        return promise;
    }

    async function removeIronManFlags(files) {
        for (var key in files) {
            if (files.hasOwnProperty(key)) {
                files[key] = await removeIronManFlagsFromFile(files[key]);
            }
        }
        return files;
    }

    function removeIronManFlagsFromFile(file) {
        return new Promise((resolve, reject) => {

            /*
            "	ironman=\"save games/Ironman_Normandy.ck2\""
            "	seed=143"
            "	count=250599"
             */
            // var lines = file.split('\n');
            // for(var i = 0; i < 20; i++) {
            //     console.log("before: line: ", lines[i]);
            // }


            const regexp = /\s*ironman=.*\n\s*seed=.*\n\s*count=.*/;
            const newText = file.replace(regexp, "\n");

            // var lines2 = newText.split('\n');
            // for(var i = 0; i < 20; i++) {
            //     console.log("after: line: ", lines2[i]);
            // }

            resolve(newText);
        });
    }

    function reZip(files, filename) {
        const zipFile = new JSZip();
        for (var key in files) {
            if (files.hasOwnProperty(key)) {
                zipFile.file(key, files[key]);
            }
        }

        zipFile.generateAsync({
            type: "base64",
            compression: "DEFLATE",
            compressionOptions: {
                level: 6
            }
        }).then(function (base64) {
            const link = document.createElement('a');
            link.href = "data:application/zip;base64," + base64;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // window.location = "data:application/zip;base64," + base64;
        }, function (err) {
            alert("err:" + err);
        });

        return new Promise((resolve, reject) => {
            resolve("");
        });
    }

    function getFilename(unzipped) {
        for (var key in unzipped) {
            if (unzipped.hasOwnProperty(key)) {
                if(key !== "meta") {
                    return key;
                }
            }
        }
    }

    return element;
}

document.body.appendChild(component());
